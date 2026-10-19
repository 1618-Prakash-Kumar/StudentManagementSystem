package com.example.Backend.repository;

import com.example.Backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversation_IdOrderByCreatedAtAscIdAsc(Long conversationId);

    Optional<Message> findFirstByConversation_IdOrderByCreatedAtDescIdDesc(Long conversationId);

    @Query("""
            select count(m) from Message m
            where m.conversation.id = :conversationId
              and m.sender.id <> :userId
              and m.isRead = false
            """)
    long countUnreadForConversation(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId
    );

    @Query("""
            select count(m) from Message m
            where m.sender.id <> :userId
              and m.isRead = false
              and (m.conversation.buyer.id = :userId or m.conversation.seller.id = :userId)
            """)
    long countUnreadForUser(@Param("userId") Long userId);

    @Modifying
    @Query("""
            update Message m
            set m.isRead = true
            where m.conversation.id = :conversationId
              and m.sender.id <> :userId
              and m.isRead = false
            """)
    int markReceivedMessagesRead(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId
    );

    @Modifying
    @Query("""
            delete from Message m
            where m.conversation.id in (
                select c.id from Conversation c
                where c.buyer.id = :userId or c.seller.id = :userId
            )
            """)
    int deleteForConversationParticipant(@Param("userId") Long userId);
}
