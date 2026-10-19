package com.example.Backend.repository;

import com.example.Backend.entity.CartItem;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUserOrderByCreatedAtDesc(User user);

    Optional<CartItem> findByUserAndProduct(User user, Product product);

    boolean existsByProduct(Product product);

    void deleteByUser(User user);
}
