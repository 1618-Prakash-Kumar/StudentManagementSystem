package com.example.Backend.service;

import com.example.Backend.dto.AuthResponse;
import com.example.Backend.dto.LoginRequest;
import com.example.Backend.entity.User;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import com.example.Backend.dto.RegisterRequest;
import com.example.Backend.entity.Role;
//import com.example.Backend.entity.User;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

    public boolean emailExists(String email) {

        return userRepository.findByEmail(email).isPresent();

    }

    public String register(RegisterRequest request) {

        // Step 1: Check if email already exists
        if (emailExists(request.getEmail())) {
            return "Email already exists";
        }

        // Step 2: Create a User object
        User user = new User();

        user.setFullname(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));//user.setPassword(request.getPassword());
        user.setPhone(request.getPhone());
        user.setRole(Role.STUDENT);

        // Step 3: Save user
        userRepository.save(user);

        // Step 4: Return response
        return "Registration Successful";
    }

    public AuthResponse login(LoginRequest request) {

        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

        if (optionalUser.isEmpty()) {
            return new AuthResponse("User Not Found",null,null);
        }

        User user = optionalUser.get();
        if(passwordEncoder.matches(request.getPassword(), user.getPassword())){
            String token =jwtService.generateToken(user.getEmail());
            return new AuthResponse(
                    "Login Successful",
                    user.getRole().name(),
                    token);
        }
        return new AuthResponse("Invailid Password!",null,null);

    }
}
