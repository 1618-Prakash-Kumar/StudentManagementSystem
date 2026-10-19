package com.example.Backend.service;

import com.example.Backend.dto.user.AdminCreateUserRequest;
import com.example.Backend.dto.user.UserResponse;
import com.example.Backend.entity.Role;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    UserResponse getUserById(Long id);

    UserResponse createUserByAdmin(AdminCreateUserRequest request);

    UserResponse updateUserRole(Long id, Role newRole, String currentAdminEmail);

    void deleteUser(Long id, String currentAdminEmail);

}
