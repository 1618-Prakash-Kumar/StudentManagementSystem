package com.example.Backend.service.storage;

import org.springframework.web.multipart.MultipartFile;

public interface ImageStorageService {

    StoredImage upload(MultipartFile image);

    void delete(String storageKey);

    boolean isConfigured();
}
