package com.example.Backend.dto.product;

import lombok.*;

import java.math.BigDecimal;


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

    private String categoryName;

    private String sellerName;

    private String status;

    private String productCondition;

}