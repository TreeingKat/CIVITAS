package com.civitas.platform.filter;

import com.civitas.platform.config.JwtService;
import com.civitas.platform.modules.members.MemberRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwt;private final MemberRepository members;
    public JwtAuthenticationFilter(JwtService jwt,MemberRepository members){this.jwt=jwt;this.members=members;}
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{String header=request.getHeader("Authorization");if(header!=null&&header.startsWith("Bearer "))try{UUID id=UUID.fromString(jwt.extractMemberId(header.substring(7)));members.findById(id).ifPresent(member->{var auth=new UsernamePasswordAuthenticationToken(member.getEmail(),null,List.of(new SimpleGrantedAuthority("ROLE_"+member.getRole().name())));SecurityContextHolder.getContext().setAuthentication(auth);});}catch(JwtException|IllegalArgumentException ignored){SecurityContextHolder.clearContext();}chain.doFilter(request,response);}
}
