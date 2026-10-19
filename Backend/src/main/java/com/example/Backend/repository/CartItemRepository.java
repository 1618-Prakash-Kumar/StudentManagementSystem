package com.example.Backend.repository;

import com.example.Backend.entity.CartItem;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUserOrderByCreatedAtDesc(User user);

    Optional<CartItem> findByUserAndProduct(User user, Product product);

    @Modifying
    @Query("delete from CartItem item where item.product.id = :productId")
    int deleteForProduct(@Param("productId") Long productId);

    void deleteByUser(User user);
}
