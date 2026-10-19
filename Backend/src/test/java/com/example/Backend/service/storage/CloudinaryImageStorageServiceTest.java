package com.example.Backend.service.storage;

import com.example.Backend.exception.ImageStorageNotConfiguredException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CloudinaryImageStorageServiceTest {

    @Test
    void missingCloudinaryPropertiesProduceTheExpectedConfigurationError() {
        CloudinaryImageStorageService storageService =
                new CloudinaryImageStorageService("", "", "");

        assertFalse(storageService.isConfigured());
        assertThrows(
                ImageStorageNotConfiguredException.class,
                () -> storageService.upload(null)
        );
    }
}
