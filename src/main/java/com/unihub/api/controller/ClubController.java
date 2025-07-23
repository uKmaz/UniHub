package com.unihub.api.controller;

import com.unihub.api.controller.requests.ClubCreationRequest;
import com.unihub.api.controller.responses.ClubResponse;
import com.unihub.api.model.Club;
import com.unihub.api.service.ClubService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
public class ClubController {

    private final ClubService clubService;

    public ClubController(ClubService clubService) {
        this.clubService = clubService;
    }
    @GetMapping
    public List<ClubResponse> getAllClubs() {
        // Artık DTO listesi döndürüyoruz.
        return clubService.getAllClubsAsDto();
    }

    // YENİ ENDPOINT: Tek bir kulübü getirmek için.
    @GetMapping("/{clubId}")
    public ClubResponse getClubById(@PathVariable Long clubId) {
        return clubService.getClubById(clubId);
    }

    @PostMapping
    public ClubResponse createClub(@RequestBody ClubCreationRequest request, Authentication authentication) {
        String creatorFirebaseUid = (String) authentication.getPrincipal();
        return clubService.createClub(request, creatorFirebaseUid);
    }

    @PostMapping("/{clubId}/join")
    public ResponseEntity<String> requestToJoinClub(@PathVariable Long clubId, Authentication authentication) {
        String memberFirebaseUid = (String) authentication.getPrincipal();
        clubService.requestToJoinClub(clubId, memberFirebaseUid);
        return ResponseEntity.ok("Join request sent successfully.");
    }

    @PostMapping("/{clubId}/requests/{userIdToManage}/approve")
    public ResponseEntity<String> approveJoinRequest(@PathVariable Long clubId, @PathVariable Long userIdToManage, Authentication authentication) {
        String adminFirebaseUid = (String) authentication.getPrincipal();
        clubService.manageJoinRequest(clubId, userIdToManage, true, adminFirebaseUid);
        return ResponseEntity.ok("User approved successfully.");
    }
}