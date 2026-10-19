package com.example.Backend.service.impl;

import com.example.Backend.entity.User;
import com.example.Backend.repository.ConversationRepository;
import com.example.Backend.repository.MessageRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MessagingServiceImplTest {

    private ConversationRepository conversationRepository;
    private MessageRepository messageRepository;
    private UserRepository userRepository;
    private MessagingServiceImpl messagingService;

    @BeforeEach
    void setUp() {
        conversationRepository = mock(ConversationRepository.class);
        messageRepository = mock(MessageRepository.class);
        userRepository = mock(UserRepository.class);
        messagingService = new MessagingServiceImpl(
                conversationRepository,
                messageRepository,
                mock(ProductRepository.class),
                userRepository
        );
    }

    @Test
    void conversationsAreQueriedForBothSidesUsingTheAuthenticatedUser() {
        User currentUser = User.builder().id(27L).email("student@example.edu").build();
        when(userRepository.findByEmailIgnoreCase("student@example.edu")).thenReturn(Optional.of(currentUser));
        when(conversationRepository.findByBuyer_IdOrSeller_IdOrderByUpdatedAtDesc(27L, 27L))
                .thenReturn(List.of());

        assertEquals(List.of(), messagingService.getConversations("student@example.edu"));

        verify(conversationRepository).findByBuyer_IdOrSeller_IdOrderByUpdatedAtDesc(27L, 27L);
    }

    @Test
    void unreadCountIsScopedToTheAuthenticatedUser() {
        User currentUser = User.builder().id(27L).email("student@example.edu").build();
        when(userRepository.findByEmailIgnoreCase("student@example.edu")).thenReturn(Optional.of(currentUser));
        when(messageRepository.countUnreadForUser(27L)).thenReturn(3L);

        assertEquals(3L, messagingService.getUnreadCount("student@example.edu"));

        verify(messageRepository).countUnreadForUser(27L);
    }

    @Test
    void unreadAggregateUsesEntityMappingsInsteadOfHardCodedTableColumns() throws NoSuchMethodException {
        Query query = MessageRepository.class
                .getMethod("countUnreadForUser", Long.class)
                .getAnnotation(Query.class);

        assertFalse(query.nativeQuery());
        assertTrue(query.value().contains("m.conversation.buyer.id"));
        assertTrue(query.value().contains("m.conversation.seller.id"));
        assertTrue(query.value().contains("m.isRead = false"));
    }
}
