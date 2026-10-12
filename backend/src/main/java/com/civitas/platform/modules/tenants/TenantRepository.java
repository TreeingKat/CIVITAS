package com.civitas.platform.modules.tenants;
import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface TenantRepository extends JpaRepository<Tenant,UUID>{boolean existsByCodeIgnoreCase(String code); List<Tenant> findByCreatedByEmailIgnoreCase(String email);}
