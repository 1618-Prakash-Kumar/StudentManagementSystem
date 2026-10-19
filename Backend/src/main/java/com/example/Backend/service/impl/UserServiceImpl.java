package com.example.Backend.service.impl;

import com.example.Backend.dto.user.AdminCreateUserRequest;
import com.example.Backend.dto.user.UserResponse;
import com.example.Backend.entity.Role;
import com.example.Backend.entity.User;
import com.example.Backend.exception.BadRequestException;
import com.example.Backend.exception.DuplicateResourceException;
import com.example.Backend.exception.ResourceNotFoundException;
import com.example.Backend.repository.UserRepository;
import com.example.Backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(this::mapToUserResponse)
                .toList();
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUserByAdmin(AdminCreateUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Email is already registered: " + request.getEmail());
        }

        Role assignedRole = request.getRole() != null ? request.getRole() : Role.USER;

        User user = User.builder()
                .fullname(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(assignedRole)
                .build();

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(Long id, Role newRole, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && newRole != Role.ADMIN) {
            throw new BadRequestException("You cannot remove your own ADMIN role.");
        }

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new BadRequestException("You cannot delete your own account from the Admin Panel.");
        }

        userRepository.delete(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullname())
                .email(user.getEmail())
                .phone(user.getPhone() != null ? user.getPhone() : "")
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .productCount(user.getProducts() != null ? user.getProducts().size() : 0)
                .build();
    }
}
