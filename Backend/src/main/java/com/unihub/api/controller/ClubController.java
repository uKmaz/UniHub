package com.unihub.api.controller;

import com.unihub.api.controller.requests.ClubCreationRequest;
import com.unihub.api.controller.requests.ClubUpdateRequest;
import com.unihub.api.controller.requests.EventCreationRequest;
import com.unihub.api.controller.requests.NotificationSettingsRequest;
import com.unihub.api.controller.responses.*;
import com.unihub.api.model.User;
import com.unihub.api.service.ClubService;
import com.unihub.api.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/clubs")
public class ClubController {

    private final ClubService clubService;
    private final EventService eventService;

    public ClubController(ClubService clubService,  EventService eventService) {
        this.clubService = clubService;
        this.eventService = eventService;
    }

    @GetMapping
    public List<ClubResponse> getAllClubs(Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        return clubService.getAllClubsAsDto(firebaseUid);
    }

    @GetMapping("/{clubId}")
    public ClubDetailResponse getClubById(@PathVariable Long clubId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        return clubService.getClubDetails(clubId, firebaseUid); // Yeni servis metodunu çağır
    }

    @PostMapping
    public ClubResponse createClub(@RequestBody ClubCreationRequest request, Authentication authentication) {
        String creatorFirebaseUid = (String) authentication.getPrincipal();
        return clubService.createClub(request, creatorFirebaseUid);
    }
    @PutMapping("/{clubId}")
    public ClubResponse updateClubDetails(
            @PathVariable Long clubId,
            @Valid @RequestBody ClubUpdateRequest request,
            Authentication authentication) {
        String adminFirebaseUid = (String) authentication.getPrincipal();
        return clubService.updateClubDetails(clubId, request, adminFirebaseUid);
    }

    @PutMapping("/{clubId}/notifications")
    public ResponseEntity<Void> updateNotifications(
            @PathVariable Long clubId,
            @Valid @RequestBody NotificationSettingsRequest request,
            Authentication authentication) {
        String memberFirebaseUid = (String) authentication.getPrincipal();
        clubService.updateNotificationSettings(clubId, request, memberFirebaseUid);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{clubId}/members/{userIdToRemove}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long clubId,
            @PathVariable Long userIdToRemove,
            Authentication authentication) {
        String adminFirebaseUid = (String) authentication.getPrincipal();
        clubService.removeMember(clubId, userIdToRemove, adminFirebaseUid);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

    @PostMapping("/{clubId}/members/{userIdToPromote}/promote")
    public ResponseEntity<Void> promoteMember(
            @PathVariable Long clubId,
            @PathVariable Long userIdToPromote,
            Authentication authentication) {
        String adminFirebaseUid = (String) authentication.getPrincipal();
        clubService.promoteMember(clubId, userIdToPromote, adminFirebaseUid);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{clubId}/members/{userId}/demote")
    public ResponseEntity<Void> demoteMember(@PathVariable Long clubId, @PathVariable Long userId, Authentication authentication) {
        // Spring Security kullanarak işlemi yapan admin'in kimliğini alıyoruz
        String adminFirebaseUid = (String) authentication.getPrincipal();
        clubService.demoteMember(clubId, userId, adminFirebaseUid);
        return ResponseEntity.ok().build();
    }


    @PostMapping("/{clubId}/members/{newOwnerUserId}/transfer-ownership")
    public ResponseEntity<Void> transferOwnership(
            @PathVariable Long clubId,
            @PathVariable Long newOwnerUserId,
            Authentication authentication) {

        String currentOwnerFirebaseUid = (String) authentication.getPrincipal();
        clubService.transferOwnership(clubId, newOwnerUserId, currentOwnerFirebaseUid);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{clubId}/join")
    public ResponseEntity<Void> requestToJoinClub(@PathVariable Long clubId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        clubService.requestToJoinClub(clubId, firebaseUid);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{clubId}/join")
    public ResponseEntity<Void> withdrawJoinRequest(@PathVariable Long clubId, Authentication authentication) {
        // İşlemi yapan kullanıcının kimliğini al
        String memberFirebaseUid = (String) authentication.getPrincipal();

        // Servis metodunu çağır
        clubService.withdrawJoinRequest(clubId, memberFirebaseUid);

        // Başarılı yanıtı döndür
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{clubId}/pending-members")
    public List<UserInClubResponse> getPendingMembers(@PathVariable Long clubId, Authentication authentication) {
        String adminFirebaseUid = (String) authentication.getPrincipal();
        return clubService.getPendingMembers(clubId, adminFirebaseUid);
    }

    @PostMapping("/{clubId}/requests/{userId}/approve")
    public ResponseEntity<Void> approveJoinRequest(@PathVariable Long clubId, @PathVariable Long userId, Authentication authentication) {
        String adminFirebaseUid = (String) authentication.getPrincipal();
        clubService.manageJoinRequest(clubId, userId, true, adminFirebaseUid);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{clubId}/requests/{userId}/reject")
    public ResponseEntity<Void> rejectJoinRequest(@PathVariable Long clubId, @PathVariable Long userId, Authentication authentication) {
        String adminFirebaseUid = (String) authentication.getPrincipal();
        clubService.manageJoinRequest(clubId, userId, false, adminFirebaseUid);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{clubId}/logs")
    public List<ClubLogResponse> getClubLogs(@PathVariable Long clubId, Authentication authentication) {
        String adminFirebaseUid = (String) authentication.getPrincipal();
        return clubService.getClubLogs(clubId, adminFirebaseUid);
    }

    @DeleteMapping("/{clubId}/logs/{logId}")
    public ResponseEntity<Void> deleteClubLog(
            @PathVariable Long clubId,
            @PathVariable Long logId,
            Authentication authentication) {
        String ownerFirebaseUid = (String) authentication.getPrincipal();
        clubService.deleteClubLog(clubId, logId, ownerFirebaseUid);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/{clubId}/events")
    public ResponseEntity<EventDetailResponse> createEvent(
            @PathVariable Long clubId,
            @RequestBody EventCreationRequest request,
            Authentication authentication) {
        System.out.println("Controller'a girdi");
        String creatorFirebaseUid = (String) authentication.getPrincipal();
        System.out.println("Authentication'ı geçti");
        EventDetailResponse newEvent = eventService.createEventForClub(clubId, request, creatorFirebaseUid);
        System.out.println("Çalıştı");
        
        return ResponseEntity.status(HttpStatus.CREATED).body(newEvent);
    }

    // OWNER CANT LEAVE

    @DeleteMapping("/{clubId}/leave")
    public ResponseEntity<Void> leaveClub(@PathVariable Long clubId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        clubService.leaveClub(clubId, firebaseUid);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/discover")
    public Map<String, List<ClubSummaryResponse>> getDiscoveryData(
            @RequestParam(required = false) String university,
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) String department) {
        return clubService.getDiscoveryData(university, faculty, department);
    }

    @GetMapping("/search")
    public List<ClubSummaryResponse> searchClubs(@RequestParam String term) {
        return clubService.searchClubs(term);
    }

    @DeleteMapping("/{clubId}")
    public ResponseEntity<Void> deleteClub(@PathVariable Long clubId, Authentication authentication) {
        String ownerFirebaseUid = (String) authentication.getPrincipal();
        clubService.deleteClub(clubId, ownerFirebaseUid);
        return ResponseEntity.noContent().build();
    }
}