package com.example.Backend.dto.product;

import com.example.Backend.entity.ProductCondition;
import com.example.Backend.entity.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 whole-number digits and 2 decimal places")
    private BigDecimal price;

    @Min(value = 0, message = "Quantity cannot be negative")
    @Max(value = 100000, message = "Quantity cannot exceed 100000")
    private Integer quantity;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private ProductCondition productCondition;

    private ProductStatus status;

}
