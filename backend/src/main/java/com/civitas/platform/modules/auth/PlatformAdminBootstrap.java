package com.civitas.platform.modules.auth;

import com.civitas.platform.modules.members.Member;
import com.civitas.platform.modules.members.MemberRepository;
import com.civitas.platform.modules.members.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class PlatformAdminBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(PlatformAdminBootstrap.class);
    private final MemberRepository members;
    private final PasswordEncoder passwords;
    private final String email;
    private final String password;
    private final String fullName;

    public PlatformAdminBootstrap(MemberRepository members,PasswordEncoder passwords,
            @Value("${app.bootstrap-admin.email:}") String email,
            @Value("${app.bootstrap-admin.password:}") String password,
            @Value("${app.bootstrap-admin.full-name:CIVITAS Platform Administrator}") String fullName){
        this.members=members;this.passwords=passwords;this.email=email;this.password=password;this.fullName=fullName;
    }

    @Override public void run(ApplicationArguments args){
        if(email.isBlank()&&password.isBlank()){
            log.warn("No platform admin provisioned: set CIVITAS_ADMIN_EMAIL and CIVITAS_ADMIN_PASSWORD in the Spring Boot process environment");
            return;
        }
        if(email.isBlank()||password.isBlank())throw new IllegalStateException("Set both CIVITAS_ADMIN_EMAIL and CIVITAS_ADMIN_PASSWORD to provision the platform admin");
        String normalized=email.trim().toLowerCase();
        var existing=members.findByEmailIgnoreCase(normalized);
        var admin=existing.orElseGet(()->new Member(normalized,fullName,passwords.encode(password)));
        admin.setFullName(fullName);
        admin.setPasswordHash(passwords.encode(password));
        admin.setRole(Role.PLATFORM_ADMIN);
        admin.setEmailVerified(true);
        members.save(admin);
        log.info("Platform administrator provisioned for {}. Use the configured CIVITAS_ADMIN_PASSWORD to sign in.", normalized);
    }
}
