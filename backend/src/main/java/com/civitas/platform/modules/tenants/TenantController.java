package com.civitas.platform.modules.tenants;
import jakarta.validation.Valid; import org.springframework.security.core.Authentication; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/tenants") public class TenantController {
 private final TenantService service; public TenantController(TenantService service){this.service=service;}
 @PostMapping public TenantDtos.TenantResponse create(@Valid @RequestBody TenantDtos.CreateTenantRequest request,Authentication auth){return service.create(auth.getName(),request);}
 @GetMapping public List<TenantDtos.TenantResponse> all(){return service.all();}
 @GetMapping("/mine") public List<TenantDtos.TenantResponse> mine(Authentication auth){return service.mine(auth.getName());}
}
