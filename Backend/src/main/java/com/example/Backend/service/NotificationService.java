package com.example.Backend.service;

import com.example.Backend.dto.notification.NotificationResponse;

import java.util.List;

public interface NotificationService {

    List<NotificationResponse> getSellerNotifications(String sellerEmail);

    NotificationResponse markAsRead(Long notificationId, String sellerEmail);

    void markAllAsRead(String sellerEmail);

    long getUnreadCount(String sellerEmail);
}
