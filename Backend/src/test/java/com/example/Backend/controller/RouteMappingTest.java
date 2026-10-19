package com.example.Backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;
import org.springframework.http.server.PathContainer;

import static org.junit.jupiter.api.Assertions.*;

class RouteMappingTest {

    private final PathPatternParser parser = new PathPatternParser();

    @Test
    void productIdRouteAcceptsNumbersButNotFixedRouteNames() {
        PathPattern numericProductRoute = parser.parse("/api/products/{id:\\d+}");
        assertTrue(numericProductRoute.matches(PathContainer.parsePath("/api/products/42")));
        assertFalse(numericProductRoute.matches(PathContainer.parsePath("/api/products/my-listings")));

        PathPattern myListingsRoute = parser.parse("/api/products/my-listings");
        assertTrue(myListingsRoute.matches(PathContainer.parsePath("/api/products/my-listings")));
    }

    @Test
    void productControllerDeclaresTheDedicatedMyListingsRoute() throws NoSuchMethodException {
        GetMapping mapping = ProductController.class
                .getMethod("getMyListings", org.springframework.security.core.Authentication.class)
                .getAnnotation(GetMapping.class);

        assertNotNull(mapping);
        assertArrayEquals(new String[]{"/my-listings"}, mapping.value());
    }

    @Test
    void genericProductIdRouteIsConstrainedToNumericIds() throws NoSuchMethodException {
        GetMapping mapping = ProductController.class
                .getMethod("getProductById", Long.class)
                .getAnnotation(GetMapping.class);

        assertNotNull(mapping);
        assertArrayEquals(new String[]{"/{id:\\d+}"}, mapping.value());
    }

    @Test
    void productImageReadRouteIsExplicitAndNumeric() throws NoSuchMethodException {
        GetMapping mapping = ProductController.class
                .getMethod("getProductImages", Long.class)
                .getAnnotation(GetMapping.class);

        assertNotNull(mapping);
        assertArrayEquals(new String[]{"/{id:\\d+}/images"}, mapping.value());
        assertTrue(parser.parse("/api/products/{id:\\d+}/images")
                .matches(PathContainer.parsePath("/api/products/6/images")));
    }

    @Test
    void cartReadSupportsBothExistingAndItemsPaths() throws NoSuchMethodException {
        GetMapping mapping = CartController.class
                .getMethod("getCart", org.springframework.security.core.Authentication.class)
                .getAnnotation(GetMapping.class);

        assertNotNull(mapping);
        assertArrayEquals(new String[]{"", "/items"}, mapping.value());
    }
}
