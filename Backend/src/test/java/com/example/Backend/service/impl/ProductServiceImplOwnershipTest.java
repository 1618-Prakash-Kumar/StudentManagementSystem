package com.example.Backend.service.impl;

import com.example.Backend.entity.Product;
import com.example.Backend.entity.ProductImage;
import com.example.Backend.entity.Role;
import com.example.Backend.entity.User;
import com.example.Backend.exception.BadRequestException;
import com.example.Backend.exception.ResourceNotFoundException;
import com.example.Backend.exception.UnauthorisedException;
import com.example.Backend.repository.CartItemRepository;
import com.example.Backend.repository.CategoryRepository;
import com.example.Backend.repository.ConversationRepository;
import com.example.Backend.repository.NotificationRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.repository.query.parser.PartTree;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.*;

class ProductServiceImplOwnershipTest {

    private ProductRepository productRepository;
    private UserRepository userRepository;
    private CategoryRepository categoryRepository;
    private CartItemRepository cartItemRepository;
    private NotificationRepository notificationRepository;
    private ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        userRepository = mock(UserRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        cartItemRepository = mock(CartItemRepository.class);
        notificationRepository = mock(NotificationRepository.class);
        productService = new ProductServiceImpl();
        ReflectionTestUtils.setField(productService, "productRepository", productRepository);
        ReflectionTestUtils.setField(productService, "userRepository", userRepository);
        ReflectionTestUtils.setField(productService, "cartItemRepository", cartItemRepository);
        ReflectionTestUtils.setField(productService, "notificationRepository", notificationRepository);
        ReflectionTestUtils.setField(productService, "conversationRepository", mock(ConversationRepository.class));
        ReflectionTestUtils.setField(productService, "categoryRepository", categoryRepository);
        ReflectionTestUtils.setField(productService, "imageStorageService", mock(
                com.example.Backend.service.storage.ImageStorageService.class
        ));
    }

    @Test
    void myListingsAreLoadedForTheAuthenticatedUser() {
        User authenticatedUser = User.builder().id(12L).email("student@example.edu").build();
        when(userRepository.findByEmailIgnoreCase("student@example.edu")).thenReturn(Optional.of(authenticatedUser));
        when(productRepository.findBySellerOrderByCreatedAtDesc(authenticatedUser)).thenReturn(List.of());

        productService.getMyListings("student@example.edu");

        verify(productRepository).findBySellerOrderByCreatedAtDesc(authenticatedUser);
        verifyNoMoreInteractions(productRepository);
    }

    @Test
    void sellerListingsRepositoryMethodResolves() {
        assertDoesNotThrow(() -> new PartTree("findBySellerOrderByCreatedAtDesc", Product.class));
    }

    @Test
    void getProductImagesReturnsStoredImageUrlsWithoutCallingStorageProvider() {
        Product product = Product.builder()
                .id(6L)
                .images(List.of(
                        ProductImage.builder().id(19L).imageUrl("https://images.example.test/listing.png").build(),
                        ProductImage.builder().id(20L).imageUrl(" ").build()
                ))
                .build();
        when(productRepository.findById(6L)).thenReturn(Optional.of(product));

        var images = productService.getProductImages(6L);

        org.junit.jupiter.api.Assertions.assertEquals(1, images.size());
        org.junit.jupiter.api.Assertions.assertEquals(19L, images.get(0).getId());
        org.junit.jupiter.api.Assertions.assertEquals("https://images.example.test/listing.png", images.get(0).getImageUrl());
        verifyNoInteractions(imageStorageService());
    }

    @Test
    void updateRejectsAnotherUsersProduct() {
        User owner = User.builder().id(21L).email("owner@example.edu").build();
        User authenticatedUser = User.builder().id(22L).email("other@example.edu").role(Role.STUDENT).build();
        Product product = Product.builder().id(4L).seller(owner).build();
        when(productRepository.findById(4L)).thenReturn(Optional.of(product));
        when(userRepository.findByEmailIgnoreCase("other@example.edu")).thenReturn(Optional.of(authenticatedUser));

        assertThrows(UnauthorisedException.class,
                () -> productService.updateProduct(4L, null, "other@example.edu"));
        verifyNoInteractions(categoryRepository);
    }

    @Test
    void editReadHidesAnotherUsersListing() {
        User owner = User.builder().id(21L).email("owner@example.edu").build();
        User authenticatedUser = User.builder().id(22L).email("other@example.edu").role(Role.STUDENT).build();
        Product product = Product.builder().id(4L).seller(owner).build();
        when(productRepository.findById(4L)).thenReturn(Optional.of(product));
        when(userRepository.findByEmailIgnoreCase("other@example.edu")).thenReturn(Optional.of(authenticatedUser));

        assertThrows(ResourceNotFoundException.class,
                () -> productService.getMyListing(4L, "other@example.edu"));
    }

    @Test
    void deleteRefusesProductsStillReferencedByACart() {
        User owner = User.builder().id(21L).email("owner@example.edu").role(Role.STUDENT).build();
        Product product = Product.builder().id(4L).seller(owner).build();
        when(productRepository.findById(4L)).thenReturn(Optional.of(product));
        when(userRepository.findByEmailIgnoreCase("owner@example.edu")).thenReturn(Optional.of(owner));
        when(cartItemRepository.existsByProduct(product)).thenReturn(true);

        assertThrows(BadRequestException.class,
                () -> productService.deleteProduct(4L, "owner@example.edu"));
        verify(productRepository, never()).delete(product);
        verifyNoInteractions(notificationRepository);
    }

    private com.example.Backend.service.storage.ImageStorageService imageStorageService() {
        return (com.example.Backend.service.storage.ImageStorageService)
                ReflectionTestUtils.getField(productService, "imageStorageService");
    }
}
