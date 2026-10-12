package com.civitas.platform.modules.onboarding;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface CandidateRepository extends JpaRepository<Candidate,UUID>{List<Candidate> findByMemberEmailIgnoreCaseOrderByRegisteredAtDesc(String email);}
