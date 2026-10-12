package com.civitas.platform.modules.onboarding;
import com.civitas.platform.modules.members.*; import com.civitas.platform.modules.tenants.*; import org.springframework.dao.DataIntegrityViolationException; import org.springframework.http.HttpStatus; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.server.ResponseStatusException; import java.util.*;
@Service public class CandidateService {
 private final CandidateRepository candidates; private final MemberRepository members; private final TenantService tenants;
 public CandidateService(CandidateRepository candidates,MemberRepository members,TenantService tenants){this.candidates=candidates;this.members=members;this.tenants=tenants;}
 @Transactional public CandidateDtos.CandidateResponse register(String email,CandidateDtos.RegisterCandidateRequest r){
  Member m=members.findByEmailIgnoreCase(email).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED));
  Tenant t; try{t=tenants.find(UUID.fromString(r.tenantId()));}catch(IllegalArgumentException e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"tenantId must be a valid tenant UUID.");}
  try{Candidate saved=candidates.saveAndFlush(new Candidate(m,t,r.contestingPost(),r.statement(),r.phone()));m.setRole(Role.CANDIDATE);members.save(m);return toResponse(saved);}catch(DataIntegrityViolationException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"You have already registered for this post in this society.");}
 }
 @Transactional(readOnly=true) public List<CandidateDtos.CandidateResponse> mine(String email){return candidates.findByMemberEmailIgnoreCaseOrderByRegisteredAtDesc(email).stream().map(this::toResponse).toList();}
 private CandidateDtos.CandidateResponse toResponse(Candidate c){return new CandidateDtos.CandidateResponse(c.getId().toString(),c.getTenant().getId().toString(),c.getTenant().getName(),c.getMember().getEmail(),c.getMember().getFullName(),c.getContestingPost(),c.getStatement(),c.getPhone(),c.getStatus().name(),c.getRegisteredAt().toString());}
}
