package com.civitas.platform.modules.onboarding;
import jakarta.validation.Valid; import org.springframework.security.core.Authentication; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/candidates") public class CandidateController {
 private final CandidateService service; public CandidateController(CandidateService service){this.service=service;}
 @PostMapping public CandidateDtos.CandidateResponse register(@Valid @RequestBody CandidateDtos.RegisterCandidateRequest request,Authentication auth){return service.register(auth.getName(),request);}
 @PostMapping("/register") public CandidateDtos.CandidateResponse registerAlias(@Valid @RequestBody CandidateDtos.RegisterCandidateRequest request,Authentication auth){return service.register(auth.getName(),request);}
 @GetMapping("/mine") public List<CandidateDtos.CandidateResponse> mine(Authentication auth){return service.mine(auth.getName());}
}
