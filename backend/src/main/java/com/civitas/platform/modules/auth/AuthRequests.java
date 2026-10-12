package com.civitas.platform.modules.auth;

/** Internal request records used to keep controller DTOs independent from service logic. */
public final class AuthRequests {
    private AuthRequests() {}
    public record Register(String fullName,String email,String password) {}
    public record VerifyEmail(String email,String code) {}
    public record Login(String email,String password) {}
    public record ResendOtp(String email) {}
}
