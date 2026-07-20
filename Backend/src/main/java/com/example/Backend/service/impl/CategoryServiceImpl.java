package com.example.Backend.service.impl;

import com.example.Backend.dto.category.CategoryRequest;
import com.example.Backend.dto.category.CategoryResponse;
import com.example.Backend.entity.Category;
import com.example.Backend.exception.DuplicateResourceException;
import com.example.Backend.repository.CategoryRepository;
import com.example.Backend.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {

        // Check if category already exists
        if (categoryRepository.findByName(request.getName()).isPresent()) {
            throw new DuplicateResourceException("Category already exists");
        }

        // Convert DTO to Entity
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        // Save category
        Category savedCategory = categoryRepository.save(category);

        // Convert Entity to Response DTO
        return CategoryResponse.builder()
                .id(savedCategory.getId())
                .name(savedCategory.getName())
                .description(savedCategory.getDescription())
                .build();
    }

    @Override
    public List<CategoryResponse> getAllCategories() {

        return categoryRepository.findAll()
                .stream()
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .description(category.getDescription())
                        .build())
                .toList();
    }
}