package com.example.Backend.exception;

public class UnauthorisedException extends RuntimeException{
    public  UnauthorisedException(String message){
        super(message);
    }
}
