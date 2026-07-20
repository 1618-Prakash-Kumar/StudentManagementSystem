package com.example.Backend.service;

import com.example.Backend.dto.product.ProductRequest;
import com.example.Backend.dto.product.ProductResponse;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request, String email);

    List<ProductResponse> getAllProducts();

    ProductResponse getProductById(Long id);

    ProductResponse updateProduct(Long id, ProductRequest request, String email);

    void deleteProduct(Long id, String email);
}
