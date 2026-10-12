package com.civitas.platform.modules.auth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface EmailOtpRepository extends JpaRepository<EmailOtp, UUID> {
  Optional<EmailOtp> findTopByEmailOrderByCreatedAtDesc(String email);
  void deleteByEmail(String email);
}
