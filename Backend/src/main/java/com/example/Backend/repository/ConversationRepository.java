package com.example.Backend.repository;

import com.example.Backend.entity.Conversation;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    List<Conversation> findByBuyer_IdOrSeller_IdOrderByUpdatedAtDesc(Long buyerId, Long sellerId);

    Optional<Conversation> findByBuyerAndSellerAndProduct(User buyer, User seller, Product product);

    @Modifying
    @Query("update Conversation c set c.product = null where c.product.id = :productId")
    int clearProductReference(@Param("productId") Long productId);

    @Modifying
    @Query("delete from Conversation c where c.buyer.id = :userId or c.seller.id = :userId")
    int deleteForParticipant(@Param("userId") Long userId);
}
