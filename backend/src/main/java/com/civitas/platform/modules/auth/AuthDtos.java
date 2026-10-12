package com.civitas.platform.modules.auth;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public final class AuthDtos {
 private AuthDtos(){}
 public record RequestOtpRequest(@Email @NotBlank String email, @Size(max=120) String fullName){}
 public record VerifyOtpRequest(@Email @NotBlank String email, @NotBlank @Size(min=6,max=6) String otp, @Size(max=120) String fullName){}
 public record RegisterRequest(@NotBlank @Size(max=120) String fullName,@Email @NotBlank String email,@NotBlank @Size(min=8,max=72) String password){}
 public record VerifyEmailRequest(@Email @NotBlank String email,@NotBlank @jakarta.validation.constraints.Pattern(regexp="[0-9]{6}") String code){}
 public record LoginRequest(@Email @NotBlank String email,@NotBlank String password){}
 public record ResendOtpRequest(@Email @NotBlank String email){}
 public record MemberResponse(String id,String email,String fullName,String role,boolean emailVerified){}
 public record AuthResponse(String token,String tokenType,long expiresInSeconds,MemberResponse member){}
 public record MessageResponse(String message){}
 public record OtpResponse(String message,String email,String developmentOtp){}
}
