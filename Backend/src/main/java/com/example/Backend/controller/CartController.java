package com.example.Backend.controller;

import com.example.Backend.dto.cart.AddToCartRequest;
import com.example.Backend.dto.cart.CartSummaryResponse;
import com.example.Backend.dto.cart.UpdateCartItemRequest;
import com.example.Backend.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @PostMapping("/items")
    public ResponseEntity<CartSummaryResponse> addToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(cartService.addToCart(request, email));
    }

    @GetMapping
    public ResponseEntity<CartSummaryResponse> getCart(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(cartService.getCart(email));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<CartSummaryResponse> updateCartItemQuantity(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(cartService.updateCartItemQuantity(id, request, email));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<CartSummaryResponse> removeCartItem(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(cartService.removeCartItem(id, email));
    }

    @DeleteMapping
    public ResponseEntity<String> clearCart(Authentication authentication) {
        String email = authentication.getName();
        cartService.clearCart(email);
        return ResponseEntity.ok("Cart cleared successfully");
    }
}
