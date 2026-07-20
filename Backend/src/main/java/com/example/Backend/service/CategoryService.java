package com.example.Backend.service;

import com.example.Backend.dto.category.CategoryRequest;
import com.example.Backend.dto.category.CategoryResponse;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CategoryRequest request);

    List<CategoryResponse> getAllCategories();
}