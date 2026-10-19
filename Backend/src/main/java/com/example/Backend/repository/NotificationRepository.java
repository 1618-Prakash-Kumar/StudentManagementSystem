package com.example.Backend.repository;

import com.example.Backend.entity.Notification;
import com.example.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findBySellerOrderByCreatedAtDesc(User seller);

    long countBySellerAndIsReadFalse(User seller);
}
