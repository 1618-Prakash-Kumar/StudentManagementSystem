package com.example.Backend.service.impl;

import com.example.Backend.dto.messaging.ConversationResponse;
import com.example.Backend.dto.messaging.MessageResponse;
import com.example.Backend.entity.Conversation;
import com.example.Backend.entity.Message;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.ProductImage;
import com.example.Backend.entity.User;
import com.example.Backend.exception.BadRequestException;
import com.example.Backend.exception.ResourceNotFoundException;
import com.example.Backend.exception.UnauthorisedException;
import com.example.Backend.repository.ConversationRepository;
import com.example.Backend.repository.MessageRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.service.MessagingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MessagingServiceImpl implements MessagingService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public MessagingServiceImpl(
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String email) {
        User currentUser = getUser(email);
        return conversationRepository
                .findByBuyer_IdOrSeller_IdOrderByUpdatedAtDesc(currentUser.getId(), currentUser.getId())
                .stream()
                .map(conversation -> toConversationResponse(conversation, currentUser))
                .toList();
    }

    @Override
    @Transactional
    public ConversationResponse startConversation(Long productId, String email) {
        User buyer = getUser(email);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User seller = product.getSeller();

        if (seller.getId().equals(buyer.getId())) {
            throw new BadRequestException("You cannot message yourself about your own listing");
        }

        Conversation conversation = conversationRepository
                .findByBuyerAndSellerAndProduct(buyer, seller, product)
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder()
                                .buyer(buyer)
                                .seller(seller)
                                .product(product)
                                .build()
                ));

        return toConversationResponse(conversation, buyer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long conversationId, String email) {
        User currentUser = getUser(email);
        Conversation conversation = getAuthorizedConversation(conversationId, currentUser);

        return messageRepository.findByConversation_IdOrderByCreatedAtAscIdAsc(conversation.getId())
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(Long conversationId, String content, String email) {
        User sender = getUser(email);
        Conversation conversation = getAuthorizedConversation(conversationId, sender);
        String normalizedContent = content.trim();

        if (normalizedContent.isEmpty()) {
            throw new BadRequestException("Message content is required");
        }
        if (normalizedContent.length() > 2000) {
            throw new BadRequestException("Messages cannot exceed 2000 characters");
        }

        Message message = messageRepository.save(
                Message.builder()
                        .conversation(conversation)
                        .sender(sender)
                        .content(normalizedContent)
                        .isRead(false)
                        .build()
        );
        conversation.setUpdatedAt(message.getCreatedAt());
        conversationRepository.save(conversation);

        return toMessageResponse(message);
    }

    @Override
    @Transactional
    public void markAsRead(Long conversationId, String email) {
        User currentUser = getUser(email);
        Conversation conversation = getAuthorizedConversation(conversationId, currentUser);
        messageRepository.markReceivedMessagesRead(conversation.getId(), currentUser.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        return messageRepository.countUnreadForUser(getUser(email).getId());
    }

    private User getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Conversation getAuthorizedConversation(Long conversationId, User currentUser) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conversation.getBuyer().getId().equals(currentUser.getId())
                && !conversation.getSeller().getId().equals(currentUser.getId())) {
            throw new UnauthorisedException("You are not a participant in this conversation");
        }
        return conversation;
    }

    private ConversationResponse toConversationResponse(Conversation conversation, User currentUser) {
        User otherUser = conversation.getBuyer().getId().equals(currentUser.getId())
                ? conversation.getSeller()
                : conversation.getBuyer();
        Product product = conversation.getProduct();
        Message lastMessage = messageRepository
                .findFirstByConversation_IdOrderByCreatedAtDescIdDesc(conversation.getId())
                .orElse(null);
        String thumbnailUrl = null;

        if (product != null) {
            thumbnailUrl = product.getImages().stream()
                    .map(ProductImage::getImageUrl)
                    .filter(url -> url != null && !url.isBlank())
                    .findFirst()
                    .orElse(null);
        }

        return ConversationResponse.builder()
                .id(conversation.getId())
                .otherUserId(otherUser.getId())
                .otherUserName(otherUser.getFullname())
                .otherUserEmail(otherUser.getEmail())
                .otherUserPhone(otherUser.getPhone())
                .productId(product != null ? product.getId() : null)
                .productTitle(product != null ? product.getTitle() : "Listing unavailable")
                .productThumbnailUrl(thumbnailUrl)
                .lastMessagePreview(lastMessage != null ? lastMessage.getContent() : "")
                .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : conversation.getCreatedAt())
                .unreadCount(messageRepository.countUnreadForConversation(conversation.getId(), currentUser.getId()))
                .build();
    }

    private MessageResponse toMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullname())
                .senderEmail(message.getSender().getEmail())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .read(message.isRead())
                .build();
    }
}
