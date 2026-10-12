package com.civitas.platform.modules.onboarding;
import jakarta.validation.constraints.*;
public final class CandidateDtos {private CandidateDtos(){} public record RegisterCandidateRequest(@NotBlank String tenantId,@NotBlank @Size(max=100) String contestingPost,@NotBlank @Size(max=1000) String statement,@Size(max=30) String phone){} public record CandidateResponse(String id,String tenantId,String tenantName,String memberEmail,String fullName,String contestingPost,String statement,String phone,String status,String registeredAt){} }
