package com.example.Backend.repository;

import com.example.Backend.entity.Notification;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findBySellerOrderByCreatedAtDesc(User seller);

    long countBySellerAndIsReadFalse(User seller);

    @Modifying
    @Query("update Notification notification set notification.product = null where notification.product.id = :productId")
    int clearProductReference(@Param("productId") Long productId);
}
