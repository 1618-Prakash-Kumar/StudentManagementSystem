package com.example.Backend.exception;

public class ImageStorageNotConfiguredException extends RuntimeException {

    public ImageStorageNotConfiguredException() {
        super("Product image storage is not configured");
    }
}
