package com.example.Backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="full_name",nullable = false)
    private String fullname;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String phone;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate(){
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate(){
        updatedAt = LocalDateTime.now();
    }

    @Builder.Default
    @OneToMany(
            mappedBy = "seller",
            cascade = CascadeType.ALL
    )
    private List<Product> products = new ArrayList<>();
}

//CREATE TABLE users (
//        id BIGSERIAL PRIMARY KEY,
//        full_name VARCHAR(100) NOT NULL,
//email VARCHAR(255) UNIQUE NOT NULL,
//password VARCHAR(255) NOT NULL,
//role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'ADMIN')),
//phone VARCHAR(15),
//created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//);