package com.civitas.platform.modules.members;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "members", indexes = @Index(name = "idx_member_email", columnList = "email", unique = true))
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false, unique = true, length = 254) private String email;
    @Column(nullable = false, length = 120) private String fullName;
    @Column(length = 100) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private Role role = Role.USER;
    @Column(nullable = false) private boolean emailVerified = false;
    @Column(nullable = false) private Instant createdAt = Instant.now();

    protected Member() {}
    public Member(String email, String fullName) { this.email = email.toLowerCase().trim(); this.fullName = fullName.trim(); }
    public Member(String email, String fullName, String passwordHash) { this(email, fullName); this.passwordHash = passwordHash; }
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public Role getRole() { return role; }
    public boolean isEmailVerified() { return emailVerified; }
    public Instant getCreatedAt() { return createdAt; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setRole(Role role) { this.role = role; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
}
