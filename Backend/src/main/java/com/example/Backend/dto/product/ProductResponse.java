package com.example.Backend.dto.product;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long id;

    private String title;

    private String description;

    private BigDecimal price;

    private Integer quantity;

    private String categoryName;

    private Long categoryId;

    private String sellerName;

    private String sellerEmail;

    private String sellerPhone;

    private Long sellerId;

    private String status;

    private String productCondition;

    private List<String> imageUrls;

    private String thumbnailUrl;

    private List<ProductImageResponse> images;

    private LocalDateTime createdAt;

}
