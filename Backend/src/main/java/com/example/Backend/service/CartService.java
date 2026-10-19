package com.example.Backend.service;

import com.example.Backend.dto.cart.AddToCartRequest;
import com.example.Backend.dto.cart.CartSummaryResponse;
import com.example.Backend.dto.cart.UpdateCartItemRequest;

public interface CartService {

    CartSummaryResponse addToCart(AddToCartRequest request, String userEmail);

    CartSummaryResponse getCart(String userEmail);

    CartSummaryResponse updateCartItemQuantity(Long cartItemId, UpdateCartItemRequest request, String userEmail);

    CartSummaryResponse removeCartItem(Long cartItemId, String userEmail);

    void clearCart(String userEmail);
}
