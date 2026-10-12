package com.civitas.platform.modules.members;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface MemberRepository extends JpaRepository<Member, UUID> { Optional<Member> findByEmailIgnoreCase(String email); }
