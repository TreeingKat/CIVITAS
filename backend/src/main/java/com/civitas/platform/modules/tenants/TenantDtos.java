package com.civitas.platform.modules.tenants;
import jakarta.validation.constraints.NotBlank; import jakarta.validation.constraints.Size;
public final class TenantDtos { private TenantDtos(){} public record CreateTenantRequest(@NotBlank @Size(max=160) String name,@NotBlank @Size(min=3,max=40) String code,@NotBlank @Size(max=120) String city){} public record TenantResponse(String id,String name,String code,String city,String createdBy){} }
