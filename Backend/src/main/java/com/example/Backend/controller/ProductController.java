package com.example.Backend.controller;

import com.example.Backend.dto.product.ProductRequest;
import com.example.Backend.dto.product.ProductImageResponse;
import com.example.Backend.dto.product.ProductResponse;
import com.example.Backend.exception.BadRequestException;
import com.example.Backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import org.springframework.util.StringUtils;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ProductResponse createProduct(
            @Valid @RequestBody ProductRequest request,
            Authentication authentication
    ) {

        return productService.createProduct(
                request,
                authentication.getName()
        );
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponse> createProductWithImages(
            @Valid @RequestPart("product") ProductRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                productService.createProduct(
                        request,
                        images == null ? List.of() : images,
                        authentication.getName()
                )
        );
    }

    @PostMapping(value = "/{id:\\d+}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponse> addProductImage(
            @PathVariable Long id,
            @RequestPart("image") MultipartFile image,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                productService.addProductImage(id, image, authentication.getName())
        );
    }

    @GetMapping("/{id:\\d+}/images")
    public ResponseEntity<List<ProductImageResponse>> getProductImages(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductImages(id));
    }

    @DeleteMapping("/{id:\\d+}/images/{imageId:\\d+}")
    public ResponseEntity<ProductResponse> deleteProductImage(
            @PathVariable Long id,
            @PathVariable Long imageId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                productService.deleteProductImage(id, imageId, authentication.getName())
        );
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts(
            @RequestParam(required = false) String search
    ){
        if (search != null && search.trim().length() > 100) {
            throw new BadRequestException("Search terms cannot exceed 100 characters");
        }

        return ResponseEntity.ok(
                productService.searchProducts(StringUtils.hasText(search) ? search.trim() : null)
        );
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<ProductResponse>> getMyListings(Authentication authentication) {
        return ResponseEntity.ok(productService.getMyListings(authentication.getName()));
    }

    @GetMapping("/my-listings/{id}")
    public ResponseEntity<ProductResponse> getMyListing(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(productService.getMyListing(id, authentication.getName()));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                productService.getProductById(id)
        );
    }
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request,
            Authentication authentication
    ){

        String email = authentication.getName();

        return ResponseEntity.ok(
                productService.updateProduct(id, request, email)
        );
    }
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<String> deleteProduct(
            @PathVariable Long id,
            Authentication authentication
    ){

        String email = authentication.getName();

        productService.deleteProduct(id, email);

        return ResponseEntity.ok(
                "Product deleted successfully"
        );
    }

}
