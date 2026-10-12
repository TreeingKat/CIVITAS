package com.civitas.platform.config;

import com.civitas.platform.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.civitas.platform.modules.members.MemberRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
    @Bean UserDetailsService userDetailsService(MemberRepository members){return email->members.findByEmailIgnoreCase(email).map(member->org.springframework.security.core.userdetails.User.withUsername(member.getEmail()).password(member.getPasswordHash()==null?"":member.getPasswordHash()).authorities("ROLE_"+member.getRole().name()).build()).orElseThrow(()->new UsernameNotFoundException("Member not found"));}
    @Bean SecurityFilterChain securityFilterChain(HttpSecurity http,JwtAuthenticationFilter jwtFilter)throws Exception{return http.csrf(csrf->csrf.disable()).cors(Customizer.withDefaults()).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(a->a.requestMatchers("/api/auth/**","/api/health","/dev/h2-console/**").permitAll().requestMatchers(HttpMethod.POST,"/api/tenants").hasRole("PLATFORM_ADMIN").anyRequest().authenticated()).headers(h->h.frameOptions(f->f.sameOrigin())).addFilterBefore(jwtFilter,UsernamePasswordAuthenticationFilter.class).build();}
    @Bean CorsConfigurationSource corsConfigurationSource(@Value("${civitas.cors.allowed-origins}")String origins){var config=new CorsConfiguration();config.setAllowedOrigins(Arrays.asList(origins.split(",")));config.setAllowedMethods(Arrays.asList("GET","POST","PUT","PATCH","DELETE","OPTIONS"));config.setAllowedHeaders(Arrays.asList("Authorization","Content-Type"));config.setAllowCredentials(true);var source=new UrlBasedCorsConfigurationSource();source.registerCorsConfiguration("/**",config);return source;}
}
