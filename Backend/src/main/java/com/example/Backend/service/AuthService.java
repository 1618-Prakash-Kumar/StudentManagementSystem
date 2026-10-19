package com.example.Backend.service;

import com.example.Backend.dto.AuthResponse;
import com.example.Backend.dto.LoginRequest;
import com.example.Backend.dto.RegisterRequest;
import com.example.Backend.entity.Role;
import com.example.Backend.entity.User;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

    public boolean emailExists(String email) {
        if (email == null) return false;
        return userRepository.findByEmailIgnoreCase(email.trim()).isPresent();
    }

    public String register(RegisterRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        // Step 1: Check if email already exists
        if (emailExists(cleanEmail)) {
            return "Email already exists";
        }

        // Step 2: Create a User object (Always default to USER role for normal registration)
        User user = new User();
        user.setFullname(request.getFullName() != null ? request.getFullName().trim() : "");
        user.setEmail(cleanEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : "");
        user.setRole(Role.USER);

        // Step 3: Save user
        userRepository.save(user);

        // Step 4: Return response
        return "Registration Successful";
    }

    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim() : "";
        Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(cleanEmail);

        if (optionalUser.isEmpty()) {
            return new AuthResponse("User Not Found", null, null);
        }

        User user = optionalUser.get();
        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            String token = jwtService.generateToken(user.getEmail());
            return new AuthResponse(
                    "Login Successful",
                    user.getRole().name(),
                    token);
        }
        return new AuthResponse("Invalid Password!", null, null);
    }
}
