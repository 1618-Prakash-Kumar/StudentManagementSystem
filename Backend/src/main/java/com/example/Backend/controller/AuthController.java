package com.example.Backend.controller;

import com.example.Backend.dto.AuthResponse;
import com.example.Backend.dto.LoginRequest;
import com.example.Backend.dto.RegisterRequest;
import com.example.Backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")//frontend api - http://localhost:8080/api/auth/register
    public String register(@RequestBody RegisterRequest request) {

        return authService.register(request);

    }

    @PostMapping("/login")//frontend api - http://localhost:8080/api/auth/login
    public AuthResponse login(@RequestBody LoginRequest loginRequest){
        System.out.println("LOGIN API CALLED");
        return authService.login(loginRequest);
    }

}