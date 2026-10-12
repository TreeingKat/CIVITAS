package com.civitas.platform.config;

import com.civitas.platform.modules.members.Member;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key; private final long expirationMinutes;
    public JwtService(@Value("${app.jwt.secret}") String secret,@Value("${app.jwt.expiration-minutes}") long expirationMinutes){byte[] bytes=secret.getBytes(StandardCharsets.UTF_8);if(bytes.length<32)throw new IllegalArgumentException("JWT_SECRET must contain at least 32 bytes");this.key=Keys.hmacShaKeyFor(bytes);this.expirationMinutes=expirationMinutes;}
    public String generate(Member member){Instant now=Instant.now();return Jwts.builder().subject(member.getId().toString()).claim("email",member.getEmail()).claim("role",member.getRole().name()).issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(expirationMinutes*60))).signWith(key).compact();}
    public String extractMemberId(String token){return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();}
}
