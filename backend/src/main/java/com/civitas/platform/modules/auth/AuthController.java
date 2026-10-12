package com.civitas.platform.modules.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth){this.auth=auth;}
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) public AuthDtos.OtpResponse register(@Valid @RequestBody AuthDtos.RegisterRequest body){return auth.register(body);}
    @PostMapping("/verify-email") public AuthDtos.AuthResponse verify(@Valid @RequestBody AuthDtos.VerifyEmailRequest body){return auth.verify(body);}
    @PostMapping("/resend-otp") public AuthDtos.OtpResponse resend(@Valid @RequestBody AuthDtos.ResendOtpRequest body){return auth.resend(body);}
    @PostMapping("/login") public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest body){return auth.login(body);}
    @PostMapping("/admin/login") public AuthDtos.AuthResponse adminLogin(@Valid @RequestBody AuthDtos.LoginRequest body){return auth.adminLogin(body);}
    @PostMapping("/logout") public AuthDtos.MessageResponse logout(){return new AuthDtos.MessageResponse("Signed out. Remove the access token from this device.");}
    @GetMapping("/me") public AuthDtos.MemberResponse me(Authentication authentication){return auth.me(authentication.getName());}
}
