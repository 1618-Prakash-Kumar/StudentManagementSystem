package com.example.Backend.dto.cart;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {

    private Long id;

    private Long productId;

    private String productTitle;

    private BigDecimal unitPrice;

    private Integer quantity;

    private Integer availableQuantity;

    private BigDecimal totalPrice;

    private String productStatus;

    private String productCondition;

    private String categoryName;

    private Long sellerId;

    private String sellerName;

    private String sellerEmail;

    private String sellerPhone;
}
