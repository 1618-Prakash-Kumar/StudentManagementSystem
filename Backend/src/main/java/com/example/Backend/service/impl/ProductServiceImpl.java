package com.example.Backend.service.impl;

import com.example.Backend.dto.product.ProductRequest;
import com.example.Backend.dto.product.ProductResponse;
import com.example.Backend.entity.Category;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.ProductCondition;
import com.example.Backend.entity.ProductStatus;
import com.example.Backend.entity.User;
import com.example.Backend.exception.ResourceNotFoundException;
import com.example.Backend.exception.UnauthorisedException;
import com.example.Backend.repository.CategoryRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public ProductResponse createProduct(ProductRequest request, String email) {

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

        return mapToResponse(savedProduct);
    }

    @Override
    public List<ProductResponse> getAllProducts() {

        return productRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ProductResponse getProductById(Long id) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return mapToResponse(product);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request, String email) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.getSeller().getEmail().equalsIgnoreCase(email)) {
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

        productRepository.delete(product);
    }

    private ProductResponse mapToResponse(Product product) {

        return ProductResponse.builder()
                .id(product.getId())
                .title(product.getTitle())
                .description(product.getDescription())
                .price(product.getPrice())
                .quantity(product.getQuantity() != null ? product.getQuantity() : 0)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : "General")
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
                .build();
    }
}
