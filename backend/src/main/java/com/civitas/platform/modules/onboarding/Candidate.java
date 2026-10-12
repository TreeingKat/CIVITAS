package com.civitas.platform.modules.onboarding;
import com.civitas.platform.modules.members.Member; import com.civitas.platform.modules.tenants.Tenant;
import jakarta.persistence.*; import java.time.Instant; import java.util.UUID;
@Entity @Table(name="candidates",uniqueConstraints=@UniqueConstraint(name="uq_candidate_member_tenant_post",columnNames={"member_id","tenant_id","contesting_post"}))
public class Candidate {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="member_id",nullable=false) private Member member;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="tenant_id",nullable=false) private Tenant tenant;
 @Column(name="contesting_post",nullable=false,length=100) private String contestingPost;
 @Column(nullable=false,length=1000) private String statement;
 @Column(length=30) private String phone;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private CandidateStatus status=CandidateStatus.PENDING;
 @Column(nullable=false) private Instant registeredAt=Instant.now();
 protected Candidate(){}
 public Candidate(Member member,Tenant tenant,String post,String statement,String phone){this.member=member;this.tenant=tenant;this.contestingPost=post.trim();this.statement=statement.trim();this.phone=phone==null?null:phone.trim();}
 public UUID getId(){return id;} public Member getMember(){return member;} public Tenant getTenant(){return tenant;} public String getContestingPost(){return contestingPost;} public String getStatement(){return statement;} public String getPhone(){return phone;} public CandidateStatus getStatus(){return status;} public Instant getRegisteredAt(){return registeredAt;}
}
