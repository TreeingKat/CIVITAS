package com.civitas.platform.modules.tenants;
import com.civitas.platform.modules.members.Member;
import jakarta.persistence.*;
import java.time.Instant; import java.util.UUID;
@Entity @Table(name="tenants", indexes=@Index(name="idx_tenant_code",columnList="code",unique=true))
public class Tenant {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 @Column(nullable=false,length=160) private String name;
 @Column(nullable=false,unique=true,length=40) private String code;
 @Column(nullable=false,length=120) private String city;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="created_by_member_id",nullable=false) private Member createdBy;
 @Column(nullable=false) private Instant createdAt=Instant.now();
 protected Tenant(){}
 public Tenant(String name,String code,String city,Member createdBy){this.name=name.trim();this.code=code.trim().toUpperCase();this.city=city.trim();this.createdBy=createdBy;}
 public UUID getId(){return id;} public String getName(){return name;} public String getCode(){return code;} public String getCity(){return city;} public Member getCreatedBy(){return createdBy;} public Instant getCreatedAt(){return createdAt;}
}
