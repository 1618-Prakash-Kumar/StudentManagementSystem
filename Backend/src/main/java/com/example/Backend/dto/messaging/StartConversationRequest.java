package com.example.Backend.dto.messaging;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StartConversationRequest {

    @NotNull(message = "Product id is required")
    private Long productId;
}
