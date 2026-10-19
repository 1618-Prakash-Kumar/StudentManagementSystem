package com.example.Backend.dto.notification;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private Long id;

    private Long productId;

    private String productName;

    private Integer quantity;

    private Long buyerId;

    private String buyerName;

    private String buyerEmail;

    private String buyerPhone;

    private String message;

    private boolean isRead;

    private LocalDateTime createdAt;
}
