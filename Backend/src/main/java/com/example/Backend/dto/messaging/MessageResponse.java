package com.example.Backend.dto.messaging;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class MessageResponse {

    private Long id;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String content;
    private Instant createdAt;
    private boolean read;
}
