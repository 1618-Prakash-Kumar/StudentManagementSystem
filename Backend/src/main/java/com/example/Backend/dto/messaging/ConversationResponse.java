package com.example.Backend.dto.messaging;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class ConversationResponse {

    private Long id;
    private Long otherUserId;
    private String otherUserName;
    private String otherUserEmail;
    private String otherUserPhone;
    private Long productId;
    private String productTitle;
    private String productThumbnailUrl;
    private String lastMessagePreview;
    private Instant lastMessageAt;
    private long unreadCount;
}
