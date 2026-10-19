package com.example.Backend.service.impl;

import com.example.Backend.repository.ProductRepository;
import com.example.Backend.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.repository.query.parser.PartTree;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class ProductServiceImplSearchTest {

    private ProductRepository productRepository;
    private ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        productService = new ProductServiceImpl();
        ReflectionTestUtils.setField(productService, "productRepository", productRepository);
    }

    @Test
    void trimsSearchTermAndRequestsNewestFirstMatches() {
        when(productRepository
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCategory_NameContainingIgnoreCase(
                        anyString(), anyString(), anyString(), any(Sort.class)
                )).thenReturn(List.of());

        productService.searchProducts("  CaSiO  ");

        verify(productRepository)
                .findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCategory_NameContainingIgnoreCase(
                        eq("CaSiO"),
                        eq("CaSiO"),
                        eq("CaSiO"),
                        eq(Sort.by(Sort.Direction.DESC, "id"))
                );
        verifyNoMoreInteractions(productRepository);
    }

    @Test
    void blankSearchReturnsAllProductsNewestFirst() {
        when(productRepository.findAll(any(Sort.class))).thenReturn(List.of());

        productService.searchProducts("   ");

        verify(productRepository).findAll(Sort.by(Sort.Direction.DESC, "id"));
        verifyNoMoreInteractions(productRepository);
    }

    @Test
    void searchRepositoryPathResolvesProductDescriptionAndCategoryName() {
        assertDoesNotThrow(() -> new PartTree(
                "findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCategory_NameContainingIgnoreCase",
                Product.class
        ));
    }
}
