package com.example.Backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.Backend.entity.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
}
