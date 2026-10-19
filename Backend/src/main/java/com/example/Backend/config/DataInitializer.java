package com.example.Backend.config;

import com.example.Backend.entity.Category;
import com.example.Backend.entity.Product;
import com.example.Backend.entity.ProductCondition;
import com.example.Backend.entity.ProductStatus;
import com.example.Backend.entity.Role;
import com.example.Backend.entity.User;
import com.example.Backend.repository.CategoryRepository;
import com.example.Backend.repository.ProductRepository;
import com.example.Backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedData(
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {
        return args -> {
            // 0. Update PostgreSQL Check Constraints for Enum values
            try {
                jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;");
                jdbcTemplate.execute("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN', 'STUDENT'));");
                
                jdbcTemplate.execute("ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;");
                jdbcTemplate.execute("ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('AVAILABLE', 'NOT_AVAILABLE', 'AVAILABLE_SOON', 'RESERVED', 'SOLD'));");
                
                // Ensure existing products have a non-null quantity
                jdbcTemplate.execute("UPDATE products SET quantity = 1 WHERE quantity IS NULL OR quantity <= 0;");
                
                System.out.println(">>> PostgreSQL constraints and product schema updated successfully.");
            } catch (Exception e) {
                System.out.println(">>> PostgreSQL constraint update notice: " + e.getMessage());
            }

            // 1. Explicitly ensure Primary First ADMIN Account exists
            Optional<User> existingAdmin = userRepository.findByEmailIgnoreCase("admin@campus.edu");
            if (existingAdmin.isEmpty()) {
                User admin = User.builder()
                        .fullname("College Administrator")
                        .email("admin@campus.edu")
                        .password(passwordEncoder.encode("Admin@123"))
                        .phone("+91 9999900001")
                        .role(Role.ADMIN)
                        .build();
                userRepository.save(admin);
                System.out.println(">>> First ADMIN account created: admin@campus.edu / Admin@123");
            } else {
                User admin = existingAdmin.get();
                admin.setRole(Role.ADMIN);
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                userRepository.save(admin);
                System.out.println(">>> Primary ADMIN account verified & password synchronized: admin@campus.edu / Admin@123");
            }

            // 2. Seed Categories
            List<Category> categories = List.of(
                    Category.builder().name("Books").description("Textbooks, notes, guides, and novels").build(),
                    Category.builder().name("Electronics").description("Calculators, headphones, chargers, and devices").build(),
                    Category.builder().name("Furniture").description("Chairs, tables, shelves, and room items").build(),
                    Category.builder().name("Cycles").description("Cycles and riding accessories").build(),
                    Category.builder().name("Academic Materials").description("Lab coats, instruments, files, and supplies").build(),
                    Category.builder().name("Hostel Items").description("Buckets, lamps, bedding, and daily-use items").build(),
                    Category.builder().name("Other").description("General college marketplace listings").build()
            );

            for (Category cat : categories) {
                if (categoryRepository.findByName(cat.getName()).isEmpty()) {
                    categoryRepository.save(cat);
                }
            }

            // 3. Seed Default Campus Demo User (USER role) if not present
            User demoSeller = userRepository.findByEmailIgnoreCase("rahul.sharma@college.edu").orElseGet(() -> {
                User user = User.builder()
                        .fullname("Rahul Sharma")
                        .email("rahul.sharma@college.edu")
                        .password(passwordEncoder.encode("Password@123"))
                        .phone("+91 9876543210")
                        .role(Role.USER)
                        .build();
                return userRepository.save(user);
            });

            // 4. Seed initial products if product table is empty
            if (productRepository.count() == 0) {
                Optional<Category> booksCat = categoryRepository.findByName("Books");
                Optional<Category> elecCat = categoryRepository.findByName("Electronics");
                Optional<Category> cycleCat = categoryRepository.findByName("Cycles");
                Optional<Category> hostelCat = categoryRepository.findByName("Hostel Items");

                if (booksCat.isPresent()) {
                    productRepository.save(Product.builder()
                            .title("Data Structures and Algorithms in Java (4th Edition)")
                            .description("Very clean condition textbook with handwritten exam notes and bookmarks included. Useful for CS 2nd year.")
                            .price(new BigDecimal("450.00"))
                            .quantity(3)
                            .category(booksCat.get())
                            .seller(demoSeller)
                            .status(ProductStatus.AVAILABLE)
                            .productCondition(ProductCondition.LIKE_NEW)
                            .build());
                }

                if (elecCat.isPresent()) {
                    productRepository.save(Product.builder()
                            .title("Casio FX-991EX Scientific Calculator")
                            .description("Original solar scientific calculator with hard slide-on case. Battery backup in perfect condition.")
                            .price(new BigDecimal("799.00"))
                            .quantity(2)
                            .category(elecCat.get())
                            .seller(demoSeller)
                            .status(ProductStatus.AVAILABLE)
                            .productCondition(ProductCondition.GOOD)
                            .build());
                }

                if (cycleCat.isPresent()) {
                    productRepository.save(Product.builder()
                            .title("Hero Sprint 26T Campus Bicycle")
                            .description("Geared cycle with front basket, mudguards, and dual cable lock. Ready for daily hostel to department commute.")
                            .price(new BigDecimal("2800.00"))
                            .quantity(1)
                            .category(cycleCat.get())
                            .seller(demoSeller)
                            .status(ProductStatus.AVAILABLE)
                            .productCondition(ProductCondition.GOOD)
                            .build());
                }

                if (hostelCat.isPresent()) {
                    productRepository.save(Product.builder()
                            .title("Rechargeable LED Study Table Lamp")
                            .description("3 brightness modes, touch sensor switch, flexible neck and USB charging cable included.")
                            .price(new BigDecimal("350.00"))
                            .quantity(5)
                            .category(hostelCat.get())
                            .seller(demoSeller)
                            .status(ProductStatus.AVAILABLE)
                            .productCondition(ProductCondition.LIKE_NEW)
                            .build());
                }
            }

            // Print summary of registered users in database
            System.out.println(">>> Current users in database:");
            userRepository.findAll().forEach(u ->
                    System.out.println("    - ID " + u.getId() + ": " + u.getEmail() + " | Role: " + u.getRole() + " | Name: " + u.getFullname())
            );
        };
    }
}
