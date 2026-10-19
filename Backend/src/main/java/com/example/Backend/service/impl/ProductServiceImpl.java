package com.example.Backend.service.impl;

import com.example.Backend.dto.product.ProductRequest;
import com.example.Backend.dto.product.ProductResponse;
import com.example.Backend.dto.product.ProductImageResponse;
import com.example.Backend.entity.Category;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.ProductCondition;
import com.example.Backend.entity.ProductImage;
import com.example.Backend.entity.ProductStatus;
import com.example.Backend.entity.Role;
import com.example.Backend.entity.User;
import com.example.Backend.exception.BadRequestException;
import com.example.Backend.exception.ImageStorageException;
import com.example.Backend.exception.ResourceNotFoundException;
import com.example.Backend.exception.UnauthorisedException;
import com.example.Backend.repository.CategoryRepository;
import com.example.Backend.repository.CartItemRepository;
import com.example.Backend.repository.ConversationRepository;
import com.example.Backend.repository.NotificationRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.service.ProductService;
import com.example.Backend.service.storage.ImageStorageService;
import com.example.Backend.service.storage.StoredImage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductServiceImpl.class);
    private static final int MAX_IMAGES_PER_PRODUCT = 5;
    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_IMAGE_DIMENSION = 6000;
    private static final long MAX_IMAGE_PIXELS = 20_000_000L;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ImageStorageService imageStorageService;

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request, String email) {
        return createProduct(request, List.of(), email);
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request, List<MultipartFile> images, String email) {
        List<MultipartFile> selectedImages = images == null ? List.of() : images;
        User seller = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        ProductCondition condition = request.getProductCondition() != null 
                ? request.getProductCondition() 
                : ProductCondition.GOOD;

        Integer qty = (request.getQuantity() != null && request.getQuantity() >= 0) ? request.getQuantity() : 1;
        
        ProductStatus initialStatus = request.getStatus() != null ? request.getStatus() : ProductStatus.AVAILABLE;
        if (qty == 0) {
            initialStatus = ProductStatus.NOT_AVAILABLE;
        }

        Product product = Product.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .quantity(qty)
                .seller(seller)
                .category(category)
                .status(initialStatus)
                .productCondition(condition)
                .build();

        Product savedProduct = productRepository.save(product);

        List<StoredImage> uploadedImages = new ArrayList<>();
        try {
            validateImageCount(savedProduct, selectedImages);
            for (MultipartFile image : selectedImages) {
                validateImage(image);
                StoredImage storedImage = imageStorageService.upload(image);
                uploadedImages.add(storedImage);
                savedProduct.getImages().add(toProductImage(storedImage, savedProduct));
            }
            return mapToResponse(productRepository.saveAndFlush(savedProduct));
        } catch (RuntimeException exception) {
            cleanupUploadedImages(uploadedImages);
            throw exception;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return searchProducts(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> searchProducts(String search) {
        String normalizedSearch = search == null ? "" : search.trim();
        List<Product> matchingProducts = normalizedSearch.isEmpty()
                ? productRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                : productRepository
                        .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCategory_NameContainingIgnoreCase(
                                normalizedSearch,
                                normalizedSearch,
                                normalizedSearch,
                                Sort.by(Sort.Direction.DESC, "id")
                        );

        return matchingProducts
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getMyListings(String email) {
        User seller = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return productRepository.findBySellerOrderByCreatedAtDesc(seller)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getMyListing(Long id, String email) {
        Product product = getProduct(id);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getRole() != Role.ADMIN && !product.getSeller().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Listing not found");
        }
        return mapToResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return mapToResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductImageResponse> getProductImages(Long id) {
        Product product = getProduct(id);
        return product.getImages().stream()
                .filter(image -> image.getImageUrl() != null && !image.getImageUrl().isBlank())
                .map(image -> ProductImageResponse.builder()
                        .id(image.getId())
                        .imageUrl(image.getImageUrl())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request, String email) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != Role.ADMIN
                && !product.getSeller().getId().equals(user.getId())) {
            throw new UnauthorisedException("You are not allowed to update this product");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(category);
        
        if (request.getQuantity() != null) {
            product.setQuantity(request.getQuantity());
            if (request.getQuantity() <= 0) {
                product.setStatus(ProductStatus.NOT_AVAILABLE);
            }
        }
        
        if (request.getStatus() != null) {
            if (product.getQuantity() > 0 || request.getStatus() == ProductStatus.NOT_AVAILABLE) {
                product.setStatus(request.getStatus());
            }
        }

        if (request.getProductCondition() != null) {
            product.setProductCondition(request.getProductCondition());
        }

        Product updatedProduct = productRepository.save(product);

        return mapToResponse(updatedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id, String email) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = user.getRole().name().equals("ADMIN");

        boolean isSeller = product.getSeller()
                .getEmail()
                .equalsIgnoreCase(email);

        if (!isAdmin && !isSeller) {
            throw new UnauthorisedException(
                    "You are not allowed to delete this product"
            );
        }

        List<String> storageKeys = product.getImages().stream()
                .map(ProductImage::getStorageKey)
                .filter(key -> key != null && !key.isBlank())
                .toList();
        storageKeys.forEach(imageStorageService::delete);
        cartItemRepository.deleteForProduct(product.getId());
        notificationRepository.clearProductReference(product.getId());
        conversationRepository.clearProductReference(product.getId());
        productRepository.delete(product);
    }

    @Override
    @Transactional
    public ProductResponse addProductImage(Long id, MultipartFile image, String email) {
        Product product = getProduct(id);
        authorizeImageManagement(product, email);
        validateImageCount(product, List.of(image));
        validateImage(image);

        StoredImage storedImage = imageStorageService.upload(image);
        try {
            product.getImages().add(toProductImage(storedImage, product));
            return mapToResponse(productRepository.saveAndFlush(product));
        } catch (RuntimeException exception) {
            cleanupUploadedImages(List.of(storedImage));
            throw exception;
        }
    }

    @Override
    @Transactional
    public ProductResponse deleteProductImage(Long productId, Long imageId, String email) {
        Product product = getProduct(productId);
        authorizeImageManagement(product, email);
        ProductImage image = product.getImages().stream()
                .filter(productImage -> productImage.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Product image not found"));

        if (image.getStorageKey() != null && !image.getStorageKey().isBlank()) {
            imageStorageService.delete(image.getStorageKey());
        }
        product.getImages().remove(image);
        return mapToResponse(productRepository.save(product));
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }

    private void authorizeImageManagement(Product product, String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isSeller = product.getSeller().getId().equals(user.getId());
        if (!isAdmin && !isSeller) {
            throw new UnauthorisedException("You are not allowed to manage images for this product");
        }
    }

    private void validateImageCount(Product product, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }
        long currentImages = product.getImages().size();
        if (currentImages + images.size() > MAX_IMAGES_PER_PRODUCT) {
            throw new BadRequestException("A listing can have at most " + MAX_IMAGES_PER_PRODUCT + " images");
        }
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new BadRequestException("Select a non-empty image file");
        }
        if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new BadRequestException("Each image must be 5 MB or smaller");
        }

        String suppliedType = image.getContentType();
        if (!"image/jpeg".equalsIgnoreCase(suppliedType) && !"image/png".equalsIgnoreCase(suppliedType)) {
            throw new BadRequestException("Only JPEG and PNG images are supported");
        }

        try (ImageInputStream input = ImageIO.createImageInputStream(image.getInputStream())) {
            if (input == null) {
                throw new BadRequestException("The uploaded file is not a valid image");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw new BadRequestException("The uploaded file is not a valid image");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String format = reader.getFormatName();
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                boolean formatMatches = "image/jpeg".equalsIgnoreCase(suppliedType)
                        ? "JPEG".equalsIgnoreCase(format)
                        : "PNG".equalsIgnoreCase(format);
                if (!formatMatches) {
                    throw new BadRequestException("Image content does not match its declared file type");
                }
                if (width <= 0 || height <= 0 || width > MAX_IMAGE_DIMENSION
                        || height > MAX_IMAGE_DIMENSION || (long) width * height > MAX_IMAGE_PIXELS) {
                    throw new BadRequestException("Image dimensions must be no larger than 6000 × 6000 pixels (20 MP)");
                }
                if (reader.read(0) == null) {
                    throw new BadRequestException("The uploaded file is not a decodable image");
                }
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw new BadRequestException("The uploaded file is not a valid image");
        }
    }

    private ProductImage toProductImage(StoredImage storedImage, Product product) {
        return ProductImage.builder()
                .imageUrl(storedImage.url())
                .storageKey(storedImage.storageKey())
                .product(product)
                .build();
    }

    private void cleanupUploadedImages(List<StoredImage> uploadedImages) {
        for (StoredImage uploadedImage : uploadedImages) {
            try {
                imageStorageService.delete(uploadedImage.storageKey());
            } catch (ImageStorageException cleanupException) {
                logger.error("Could not clean up uploaded image {}", uploadedImage.storageKey(), cleanupException);
            }
        }
    }

    private ProductResponse mapToResponse(Product product) {

        return ProductResponse.builder()
                .id(product.getId())
                .title(product.getTitle())
                .description(product.getDescription())
                .price(product.getPrice())
                .quantity(product.getQuantity() != null ? product.getQuantity() : 0)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "General")
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .sellerName(product.getSeller() != null ? product.getSeller().getFullname() : "Anonymous")
                .sellerEmail(product.getSeller() != null ? product.getSeller().getEmail() : "")
                .sellerPhone(product.getSeller() != null ? product.getSeller().getPhone() : "")
                .sellerId(product.getSeller() != null ? product.getSeller().getId() : null)
                .status(product.getStatus() != null ? product.getStatus().name() : "AVAILABLE")
                .productCondition(
                        product.getProductCondition() != null
                                ? product.getProductCondition().name()
                                : "GOOD"
                )
                .createdAt(product.getCreatedAt())
                .imageUrls(product.getImages().stream()
                        .map(ProductImage::getImageUrl)
                        .filter(url -> url != null && !url.isBlank())
                        .toList())
                .images(product.getImages().stream()
                        .filter(image -> image.getImageUrl() != null && !image.getImageUrl().isBlank())
                        .map(image -> ProductImageResponse.builder()
                                .id(image.getId())
                                .imageUrl(image.getImageUrl())
                                .build())
                        .toList())
                .thumbnailUrl(product.getImages().stream()
                        .map(ProductImage::getImageUrl)
                        .filter(url -> url != null && !url.isBlank())
                        .findFirst()
                        .orElse(null))
                .build();
    }
}
