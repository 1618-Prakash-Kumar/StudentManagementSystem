package com.example.Backend.service;

import com.example.Backend.dto.product.ProductRequest;
import com.example.Backend.dto.product.ProductImageResponse;
import com.example.Backend.dto.product.ProductResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request, String email);

    ProductResponse createProduct(ProductRequest request, List<MultipartFile> images, String email);

    List<ProductResponse> getAllProducts();

    List<ProductResponse> searchProducts(String search);

    List<ProductResponse> getMyListings(String email);

    ProductResponse getMyListing(Long id, String email);

    ProductResponse getProductById(Long id);

    List<ProductImageResponse> getProductImages(Long id);

    ProductResponse updateProduct(Long id, ProductRequest request, String email);

    void deleteProduct(Long id, String email);

    ProductResponse addProductImage(Long id, MultipartFile image, String email);

    ProductResponse deleteProductImage(Long productId, Long imageId, String email);
}
