package com.example.Backend.controller;

import com.example.Backend.dto.messaging.ConversationResponse;
import com.example.Backend.dto.messaging.MessageResponse;
import com.example.Backend.dto.messaging.SendMessageRequest;
import com.example.Backend.dto.messaging.StartConversationRequest;
import com.example.Backend.dto.messaging.UnreadCountResponse;
import com.example.Backend.service.MessagingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    @GetMapping
    public List<ConversationResponse> getConversations(Authentication authentication) {
        return messagingService.getConversations(currentEmail(authentication));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationResponse startConversation(
            @Valid @RequestBody StartConversationRequest request,
            Authentication authentication
    ) {
        return messagingService.startConversation(request.getProductId(), currentEmail(authentication));
    }

    @GetMapping("/{conversationId}/messages")
    public List<MessageResponse> getMessages(
            @PathVariable Long conversationId,
            Authentication authentication
    ) {
        return messagingService.getMessages(conversationId, currentEmail(authentication));
    }

    @PostMapping("/{conversationId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication
    ) {
        return messagingService.sendMessage(conversationId, request.getContent(), currentEmail(authentication));
    }

    @PutMapping("/{conversationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(
            @PathVariable Long conversationId,
            Authentication authentication
    ) {
        messagingService.markAsRead(conversationId, currentEmail(authentication));
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse getUnreadCount(Authentication authentication) {
        return new UnreadCountResponse(messagingService.getUnreadCount(currentEmail(authentication)));
    }

    private String currentEmail(Authentication authentication) {
        return authentication.getName();
    }
}
