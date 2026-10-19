package com.example.Backend.service.impl;

import com.example.Backend.entity.User;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.ProductStatus;
import com.example.Backend.entity.CartItem;
import com.example.Backend.dto.cart.AddToCartRequest;
import com.example.Backend.dto.cart.UpdateCartItemRequest;
import com.example.Backend.exception.BadRequestException;
import com.example.Backend.repository.CartItemRepository;
import com.example.Backend.repository.NotificationRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class CartServiceImplTest {

    private CartItemRepository cartItemRepository;
    private UserRepository userRepository;
    private ProductRepository productRepository;
    private CartServiceImpl cartService;

    @BeforeEach
    void setUp() {
        cartItemRepository = mock(CartItemRepository.class);
        userRepository = mock(UserRepository.class);
        cartService = new CartServiceImpl();
        org.springframework.test.util.ReflectionTestUtils.setField(cartService, "cartItemRepository", cartItemRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(cartService, "userRepository", userRepository);
        productRepository = mock(ProductRepository.class);
        org.springframework.test.util.ReflectionTestUtils.setField(cartService, "productRepository", productRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(cartService, "notificationRepository", mock(NotificationRepository.class));
    }

    @Test
    void cartReadLoadsOnlyTheAuthenticatedUsersCart() {
        User currentUser = User.builder().id(31L).email("student@example.edu").build();
        when(userRepository.findByEmailIgnoreCase("student@example.edu")).thenReturn(Optional.of(currentUser));
        when(cartItemRepository.findByUserOrderByCreatedAtDesc(currentUser)).thenReturn(List.of());

        var cart = cartService.getCart("student@example.edu");

        assertEquals(List.of(), cart.getItems());
        assertEquals(0, cart.getTotalItems());
        verify(cartItemRepository).findByUserOrderByCreatedAtDesc(currentUser);
    }

    @Test
    void unavailableProductCannotBeAddedToCart() {
        User buyer = User.builder().id(31L).email("student@example.edu").build();
        Product product = Product.builder().id(5L).status(ProductStatus.NOT_AVAILABLE).quantity(2).build();
        when(userRepository.findByEmailIgnoreCase("student@example.edu")).thenReturn(Optional.of(buyer));
        when(productRepository.findById(5L)).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class,
                () -> cartService.addToCart(AddToCartRequest.builder().productId(5L).quantity(1).build(),
                        "student@example.edu"));
        verifyNoInteractions(cartItemRepository);
    }

    @Test
    void unavailableProductCannotHaveItsCartQuantityIncreased() {
        User buyer = User.builder().id(31L).email("student@example.edu").build();
        Product product = Product.builder().id(5L).status(ProductStatus.NOT_AVAILABLE).quantity(3).build();
        CartItem item = CartItem.builder().id(70L).user(buyer).product(product).quantity(1).build();
        when(cartItemRepository.findById(70L)).thenReturn(Optional.of(item));

        assertThrows(BadRequestException.class,
                () -> cartService.updateCartItemQuantity(70L,
                        UpdateCartItemRequest.builder().quantity(2).build(), "student@example.edu"));
        verify(cartItemRepository, never()).save(item);
    }

    @Test
    void existingUnavailableCartItemCanBeReduced() {
        User buyer = User.builder().id(31L).email("student@example.edu").build();
        Product product = Product.builder().id(5L).status(ProductStatus.NOT_AVAILABLE).quantity(3).build();
        CartItem item = CartItem.builder().id(70L).user(buyer).product(product).quantity(2).build();
        when(cartItemRepository.findById(70L)).thenReturn(Optional.of(item));
        when(userRepository.findByEmailIgnoreCase("student@example.edu")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByUserOrderByCreatedAtDesc(buyer)).thenReturn(List.of());

        var result = cartService.updateCartItemQuantity(70L,
                UpdateCartItemRequest.builder().quantity(1).build(), "student@example.edu");

        assertEquals(1, item.getQuantity());
        assertEquals(0, result.getTotalItems());
        verify(cartItemRepository).save(item);
    }
}
