package com.example.Backend.controller;

import com.example.Backend.dto.product.ProductRequest;
import com.example.Backend.dto.product.ProductResponse;
import com.example.Backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    public ProductResponse createProduct(
            @RequestBody ProductRequest request,
            Authentication authentication
    ) {

        return productService.createProduct(
                request,
                authentication.getName()
        );
    }
    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts(){

        return ResponseEntity.ok(
                productService.getAllProducts()
        );
    }
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                productService.getProductById(id)
        );
    }
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductRequest request,
            Authentication authentication
    ){

        String email = authentication.getName();

        return ResponseEntity.ok(
                productService.updateProduct(id, request, email)
        );
    }
    @DeleteMapping("/{id}")
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
