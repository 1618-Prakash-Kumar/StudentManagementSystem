package com.example.Backend.service;

import com.example.Backend.dto.messaging.ConversationResponse;
import com.example.Backend.dto.messaging.MessageResponse;

import java.util.List;

public interface MessagingService {

    List<ConversationResponse> getConversations(String email);

    ConversationResponse startConversation(Long productId, String email);

    List<MessageResponse> getMessages(Long conversationId, String email);

    MessageResponse sendMessage(Long conversationId, String content, String email);

    void markAsRead(Long conversationId, String email);

    long getUnreadCount(String email);
}
