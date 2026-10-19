package com.example.Backend.service.impl;

import com.example.Backend.entity.User;
import com.example.Backend.repository.CartItemRepository;
import com.example.Backend.repository.NotificationRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class CartServiceImplTest {

    private CartItemRepository cartItemRepository;
    private UserRepository userRepository;
    private CartServiceImpl cartService;

    @BeforeEach
    void setUp() {
        cartItemRepository = mock(CartItemRepository.class);
        userRepository = mock(UserRepository.class);
        cartService = new CartServiceImpl();
        org.springframework.test.util.ReflectionTestUtils.setField(cartService, "cartItemRepository", cartItemRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(cartService, "userRepository", userRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(cartService, "productRepository", mock(ProductRepository.class));
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
}
