package com.example.Backend.dto.cart;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartSummaryResponse {

    private List<CartItemResponse> items;

    private Integer totalItems;

    private BigDecimal grandTotal;
}
