package com.civitas.platform.modules.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger log=LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;private final boolean consoleFallback;private final String username;
    public EmailService(JavaMailSender mailSender,@Value("${app.otp.log-to-console:true}")boolean consoleFallback,@Value("${spring.mail.username:}")String username,@Value("${civitas.otp.expose-in-development:true}")boolean exposeInDevelopment){this.mailSender=mailSender;this.consoleFallback=consoleFallback&&exposeInDevelopment;this.username=username;}
    public void sendOtp(String address,String code){if(username==null||username.isBlank()){if(consoleFallback){log.warn("DEV ONLY - CIVITAS OTP for {} is {}. Configure SMTP before deployment.",address,code);return;}throw new IllegalStateException("SMTP is not configured");}var message=new SimpleMailMessage();message.setFrom(username);message.setTo(address);message.setSubject("Your CIVITAS verification code");message.setText("Your CIVITAS verification code is "+code+". It expires in five minutes. If you did not request this, ignore this email.");mailSender.send(message);}
    public boolean isSmtpConfigured(){return username!=null&&!username.isBlank();}
}
