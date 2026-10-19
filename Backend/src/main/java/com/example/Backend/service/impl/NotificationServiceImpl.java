package com.example.Backend.service.impl;

import com.example.Backend.dto.notification.NotificationResponse;
import com.example.Backend.entity.Notification;
import com.example.Backend.entity.User;
import com.example.Backend.exception.ResourceNotFoundException;
import com.example.Backend.exception.UnauthorisedException;
import com.example.Backend.repository.NotificationRepository;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getSellerNotifications(String sellerEmail) {
        User seller = userRepository.findByEmailIgnoreCase(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return notificationRepository.findBySellerOrderByCreatedAtDesc(seller)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public NotificationResponse markAsRead(Long notificationId, String sellerEmail) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getSeller().getEmail().equalsIgnoreCase(sellerEmail)) {
            throw new UnauthorisedException("You are not authorized to access this notification");
        }

        notification.setRead(true);
        Notification updated = notificationRepository.save(notification);

        return mapToResponse(updated);
    }

    @Override
    public void markAllAsRead(String sellerEmail) {
        User seller = userRepository.findByEmailIgnoreCase(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Notification> notifications = notificationRepository.findBySellerOrderByCreatedAtDesc(seller);
        for (Notification n : notifications) {
            n.setRead(true);
        }
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String sellerEmail) {
        User seller = userRepository.findByEmailIgnoreCase(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return notificationRepository.countBySellerAndIsReadFalse(seller);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .productId(notification.getProduct() != null ? notification.getProduct().getId() : null)
                .productName(notification.getProductName())
                .quantity(notification.getQuantity())
                .buyerId(notification.getBuyer() != null ? notification.getBuyer().getId() : null)
                .buyerName(notification.getBuyerName())
                .buyerEmail(notification.getBuyerEmail())
                .buyerPhone(notification.getBuyerPhone())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
