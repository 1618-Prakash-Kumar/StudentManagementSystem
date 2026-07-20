package com.example.Backend.dto.product;

import com.example.Backend.entity.ProductCondition;
import lombok.*;

import java.math.BigDecimal;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    private String title;

    private String description;

    private BigDecimal price;

    private Long categoryId;


}