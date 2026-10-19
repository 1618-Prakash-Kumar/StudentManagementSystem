package com.example.Backend.controller;

import com.example.Backend.dto.common.ApiResponse;
import com.example.Backend.dto.user.AdminCreateUserRequest;
import com.example.Backend.dto.user.UpdateRoleRequest;
import com.example.Backend.dto.user.UserResponse;
import com.example.Backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    /**
     * View all registered users (ADMIN ONLY)
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * Get user by ID (ADMIN ONLY)
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * Add/Create a new user as ADMIN (ADMIN ONLY)
     */
    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        UserResponse response = userService.createUserByAdmin(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Change user role (e.g. USER to ADMIN) (ADMIN ONLY)
     */
    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request,
            Authentication authentication
    ) {
        String adminEmail = authentication.getName();
        UserResponse response = userService.updateUserRole(id, request.getRole(), adminEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete user by ID (ADMIN ONLY)
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String adminEmail = authentication.getName();
        userService.deleteUser(id, adminEmail);
        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .success(true)
                        .message("User deleted successfully")
                        .data("User ID " + id + " has been removed")
                        .build()
        );
    }
}
