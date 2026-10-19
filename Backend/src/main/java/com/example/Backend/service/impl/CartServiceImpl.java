package com.example.Backend.service.impl;

import com.example.Backend.dto.cart.AddToCartRequest;
import com.example.Backend.dto.cart.CartItemResponse;
import com.example.Backend.dto.cart.CartSummaryResponse;
import com.example.Backend.dto.cart.UpdateCartItemRequest;
import com.example.Backend.entity.*;
import com.example.Backend.exception.BadRequestException;
import com.example.Backend.exception.ResourceNotFoundException;
import com.example.Backend.exception.UnauthorisedException;
import com.example.Backend.repository.CartItemRepository;
import com.example.Backend.repository.NotificationRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartServiceImpl implements CartService {

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public CartSummaryResponse addToCart(AddToCartRequest request, String userEmail) {
        User buyer = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Validate product availability status
        if (product.getStatus() != ProductStatus.AVAILABLE) {
            throw new BadRequestException("Cannot add product to cart: product is currently " + product.getStatus().name() + ".");
        }

        // Validate product stock
        if (product.getQuantity() == null || product.getQuantity() <= 0) {
            throw new BadRequestException("This product is currently out of stock.");
        }

        int requestedQty = request.getQuantity() != null ? request.getQuantity() : 1;
        if (requestedQty <= 0) {
            throw new BadRequestException("Quantity to add must be at least 1.");
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByUserAndProduct(buyer, product);
        int finalQuantity = requestedQty;

        if (existingItemOpt.isPresent()) {
            finalQuantity += existingItemOpt.get().getQuantity();
        }

        if (finalQuantity > product.getQuantity()) {
            throw new BadRequestException("Requested total quantity (" + finalQuantity + ") exceeds seller's available stock (" + product.getQuantity() + ").");
        }

        if (existingItemOpt.isPresent()) {
            CartItem existing = existingItemOpt.get();
            existing.setQuantity(finalQuantity);
            cartItemRepository.save(existing);
        } else {
            CartItem newItem = CartItem.builder()
                    .user(buyer)
                    .product(product)
                    .quantity(requestedQty)
                    .build();
            cartItemRepository.save(newItem);
        }

        // Create notification for seller if seller is not the buyer themselves
        if (product.getSeller() != null && !product.getSeller().getEmail().equalsIgnoreCase(buyer.getEmail())) {
            Notification notification = Notification.builder()
                    .seller(product.getSeller())
                    .buyer(buyer)
                    .product(product)
                    .quantity(requestedQty)
                    .productName(product.getTitle())
                    .buyerName(buyer.getFullname())
                    .buyerEmail(buyer.getEmail())
                    .buyerPhone(buyer.getPhone() != null ? buyer.getPhone() : "Not provided")
                    .message(buyer.getFullname() + " added " + requestedQty + " item(s) of \"" + product.getTitle() + "\" to their cart.")
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }

        return getCart(userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public CartSummaryResponse getCart(String userEmail) {
        User buyer = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<CartItem> items = cartItemRepository.findByUserOrderByCreatedAtDesc(buyer);

        List<CartItemResponse> itemResponses = items.stream().map(item -> {
            Product p = item.getProduct();
            BigDecimal unitPrice = p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO;
            BigDecimal totalItemPrice = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

            return CartItemResponse.builder()
                    .id(item.getId())
                    .productId(p.getId())
                    .productTitle(p.getTitle())
                    .unitPrice(unitPrice)
                    .quantity(item.getQuantity())
                    .availableQuantity(p.getQuantity() != null ? p.getQuantity() : 0)
                    .totalPrice(totalItemPrice)
                    .productStatus(p.getStatus() != null ? p.getStatus().name() : "AVAILABLE")
                    .productCondition(p.getProductCondition() != null ? p.getProductCondition().name() : "GOOD")
                    .categoryName(p.getCategory() != null ? p.getCategory().getName() : "General")
                    .sellerId(p.getSeller() != null ? p.getSeller().getId() : null)
                    .sellerName(p.getSeller() != null ? p.getSeller().getFullname() : "Anonymous")
                    .sellerEmail(p.getSeller() != null ? p.getSeller().getEmail() : "")
                    .sellerPhone(p.getSeller() != null ? p.getSeller().getPhone() : "")
                    .build();
        }).toList();

        BigDecimal grandTotal = itemResponses.stream()
                .map(CartItemResponse::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = itemResponses.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        return CartSummaryResponse.builder()
                .items(itemResponses)
                .totalItems(totalItems)
                .grandTotal(grandTotal)
                .build();
    }

    @Override
    public CartSummaryResponse updateCartItemQuantity(Long cartItemId, UpdateCartItemRequest request, String userEmail) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!cartItem.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new UnauthorisedException("You are not authorized to update this cart item");
        }

        if (request.getQuantity() <= 0) {
            cartItemRepository.delete(cartItem);
            return getCart(userEmail);
        }

        Product product = cartItem.getProduct();
        if (product.getStatus() != ProductStatus.AVAILABLE
                && request.getQuantity() >= cartItem.getQuantity()) {
            throw new BadRequestException("Item not available. Remove it from your cart or reduce its quantity.");
        }
        if (request.getQuantity() > product.getQuantity()) {
            throw new BadRequestException("Requested quantity (" + request.getQuantity() + ") exceeds available stock (" + product.getQuantity() + ").");
        }

        cartItem.setQuantity(request.getQuantity());
        cartItemRepository.save(cartItem);

        return getCart(userEmail);
    }

    @Override
    public CartSummaryResponse removeCartItem(Long cartItemId, String userEmail) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!cartItem.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new UnauthorisedException("You are not authorized to remove this cart item");
        }

        cartItemRepository.delete(cartItem);
        return getCart(userEmail);
    }

    @Override
    public void clearCart(String userEmail) {
        User buyer = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        cartItemRepository.deleteByUser(buyer);
    }
}
