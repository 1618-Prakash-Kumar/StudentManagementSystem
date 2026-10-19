package com.example.Backend.service.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.Backend.exception.ImageStorageException;
import com.example.Backend.exception.ImageStorageNotConfiguredException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryImageStorageService implements ImageStorageService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryImageStorageService.class);

    private final String cloudName;
    private final boolean configured;
    private final Cloudinary cloudinary;

    public CloudinaryImageStorageService(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret
    ) {
        this.cloudName = cloudName;
        this.configured = cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();
        this.cloudinary = configured
                ? new Cloudinary(ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key", apiKey,
                        "api_secret", apiSecret,
                        "secure", true
                ))
                : null;
    }

    @Override
    public StoredImage upload(MultipartFile image) {
        requireConfigured();
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    image.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "college-exchange/products",
                            "resource_type", "image",
                            "allowed_formats", new String[]{"jpg", "png"},
                            "unique_filename", true
                    )
            );
            Object url = result.get("secure_url");
            Object storageKey = result.get("public_id");
            if (!(url instanceof String imageUrl) || !(storageKey instanceof String publicId)) {
                throw new ImageStorageException("Cloudinary returned an incomplete image result");
            }
            return new StoredImage(imageUrl, publicId);
        } catch (ImageStorageException exception) {
            throw exception;
        } catch (IOException | RuntimeException exception) {
            logger.error("Product image upload failed", exception);
            throw new ImageStorageException("Image storage is temporarily unavailable", exception);
        }
    }

    @Override
    public void delete(String storageKey) {
        requireConfigured();
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(storageKey, ObjectUtils.emptyMap());
            Object status = result.get("result");
            if (!"ok".equals(status) && !"not found".equals(status)) {
                logger.error("Cloudinary did not confirm deletion of product image {}", storageKey);
                throw new ImageStorageException("Image storage did not confirm image deletion");
            }
        } catch (ImageStorageException exception) {
            throw exception;
        } catch (IOException | RuntimeException exception) {
            logger.error("Product image deletion failed for storage key {}", storageKey, exception);
            throw new ImageStorageException("Image storage is temporarily unavailable", exception);
        }
    }

    @Override
    public boolean isConfigured() {
        return configured;
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new ImageStorageNotConfiguredException();
        }
    }
}
