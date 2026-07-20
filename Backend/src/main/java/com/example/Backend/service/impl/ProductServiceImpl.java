package com.example.Backend.service.impl;

import com.example.Backend.dto.product.ProductRequest;
import com.example.Backend.dto.product.ProductResponse;
import com.example.Backend.entity.Category;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.ProductCondition;
import com.example.Backend.entity.User;
import com.example.Backend.exception.ResourceNotFoundException;
import com.example.Backend.exception.UnauthorisedException;
import com.example.Backend.repository.CategoryRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
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

        User seller = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));


        Product product = Product.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .seller(seller)
                .category(category)
                .productCondition(ProductCondition.GOOD)
                .build();


        Product savedProduct = productRepository.save(product);


        return mapToResponse(savedProduct);
    }


    @Override
    public List<ProductResponse> getAllProducts() {

        return productRepository.findAll()
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


        if(!product.getSeller().getEmail().equals(email)) {
            throw new UnauthorisedException("You are not allowed to update this product");
        }


        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));


        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(category);


        Product updatedProduct = productRepository.save(product);


        return mapToResponse(updatedProduct);
    }


    @Override
    public void deleteProduct(Long id, String email) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));


        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));


        boolean isAdmin = user.getRole().name().equals("ADMIN");

        boolean isSeller = product.getSeller()
                .getEmail()
                .equals(email);


        if(!isAdmin && !isSeller) {

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
                .categoryName(product.getCategory().getName())
                .sellerName(product.getSeller().getFullname())
                .status(product.getStatus().name())
                .productCondition(
                        product.getProductCondition() != null
                                ? product.getProductCondition().name()
                                : null
                )
                .build();
    }
}