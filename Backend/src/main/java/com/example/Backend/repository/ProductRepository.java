package com.example.Backend.repository;

import com.example.Backend.entity.Product;
import com.example.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findBySeller(User seller);
}