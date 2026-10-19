package com.example.Backend.dto.product;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProductImageResponse {
    private Long id;
    private String imageUrl;
}
