package com.civitas.platform.common;
import org.springframework.web.bind.annotation.*; import java.util.Map;
@RestController public class HealthController { @GetMapping("/api/health") public Map<String,String> health(){return Map.of("status","ok","service","civitas-backend");} }
