package com.civitas.platform.modules.auth;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="email_otps", indexes=@Index(name="idx_otp_email", columnList="email"))
public class EmailOtp {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false,length=254) private String email;
    @Column(nullable=false,length=100) private String codeHash;
    @Column(nullable=false) private Instant expiresAt;
    @Column(nullable=false) private int attempts = 0;
    @Column(nullable=false) private Instant createdAt = Instant.now();
    protected EmailOtp() {}
    public EmailOtp(String email, String codeHash, Instant expiresAt) { this.email=email.toLowerCase().trim(); this.codeHash=codeHash; this.expiresAt=expiresAt; }
    public UUID getId(){return id;} public String getEmail(){return email;} public String getCodeHash(){return codeHash;}
    public Instant getExpiresAt(){return expiresAt;} public int getAttempts(){return attempts;}
    public void incrementAttempts(){attempts++;}
}
