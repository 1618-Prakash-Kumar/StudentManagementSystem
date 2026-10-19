package com.example.Backend.repository;

import com.example.Backend.entity.Product;
import com.example.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findBySeller(User seller);

    List<Product> findBySellerOrderByCreatedAtDesc(User seller);

    List<Product> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCategory_NameContainingIgnoreCase(
            String title,
            String description,
            String categoryName,
            Sort sort
    );
}