package com.unihub.api.service;

import com.unihub.api.controller.requests.ClubCreationRequest;
import com.unihub.api.controller.responses.ClubResponse;
import com.unihub.api.controller.responses.UserInClubResponse;
import com.unihub.api.model.*;
import com.unihub.api.repository.ClubMemberRepository;
import com.unihub.api.repository.ClubRepository;
import com.unihub.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClubService {

    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final ClubMemberRepository clubMemberRepository;

    @Autowired
    public ClubService(ClubRepository clubRepository, UserRepository userRepository, ClubMemberRepository clubMemberRepository) {
        this.clubRepository = clubRepository;
        this.userRepository = userRepository;
        this.clubMemberRepository = clubMemberRepository;
    }


    @Transactional // Ensures all database operations succeed or fail together
    public ClubResponse createClub(ClubCreationRequest request, String creatorFirebaseUid) {
        // 1. Find the user who is creating the club.
        User creator = userRepository.findByFirebaseUid(creatorFirebaseUid)
                .orElseThrow(() -> new RuntimeException("Creator user not found."));

        // 2. Create and save the new club.
        Club newClub = new Club();
        newClub.setName(request.name);
        newClub.setDescription(request.description);
        newClub.setProfilePictureUrl(request.profilePictureUrl);
        Club savedClub = clubRepository.save(newClub);

        // 3. Create the membership record making the creator the ADMIN.
        ClubMember membership = new ClubMember();
        membership.setClub(savedClub);
        membership.setUser(creator);
        membership.setRole(Role.OWNER);
        membership.setStatus(MembershipStatus.APPROVED);
        clubMemberRepository.save(membership);

        return mapClubToClubResponse(savedClub);
    }

    public void requestToJoinClub(Long clubId, String memberFirebaseUid) {
        User user = userRepository.findByFirebaseUid(memberFirebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found."));

        // Check if a membership request already exists
        boolean alreadyMemberOrPending = clubMemberRepository.existsByUserAndClub(user, club);
        if (alreadyMemberOrPending) {
            throw new IllegalStateException("User is already a member or has a pending request.");
        }

        ClubMember newRequest = new ClubMember();
        newRequest.setUser(user);
        newRequest.setClub(club);
        newRequest.setRole(Role.MEMBER);
        newRequest.setStatus(MembershipStatus.PENDING);
        clubMemberRepository.save(newRequest);
    }

    public void manageJoinRequest(Long clubId, Long userIdToManage, boolean approve, String adminFirebaseUid) {
        // Authorization Check
        findMembership(adminFirebaseUid, clubId, Role.OWNER, Role.MANAGER);

        ClubMember request = clubMemberRepository.findByClubIdAndUserId(clubId, userIdToManage)
                .orElseThrow(() -> new RuntimeException("Membership request not found."));

        if (approve) {
            request.setStatus(MembershipStatus.APPROVED);
            clubMemberRepository.save(request);
        } else {
            clubMemberRepository.delete(request);
        }
    }

    // Helper method for authorization checks
    private ClubMember findMembership(String firebaseUid, Long clubId, Role... allowedRoles) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));

        ClubMember membership = clubMemberRepository.findByClubIdAndUserId(clubId, user.getId())
                .orElseThrow(() -> new RuntimeException("User is not a member of this club."));

        for (Role allowedRole : allowedRoles) {
            if (membership.getRole() == allowedRole) {
                return membership;
            }
        }

        throw new SecurityException("User does not have the required role for this action.");
    }

    // Tek bir kulübü DTO olarak getirir.
    public ClubResponse getClubById(Long clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found with id: " + clubId));

        // Entity'yi DTO'ya çeviriyoruz.
        return mapClubToClubResponse(club);
    }

    // Tüm kulüpleri DTO listesi olarak getirir.
    public List<ClubResponse> getAllClubsAsDto() {
        return clubRepository.findAll()
                .stream()
                .map(this::mapClubToClubResponse)
                .collect(Collectors.toList());
    }

    // YARDIMCI METOD: Entity -> DTO dönüşümünü yapar.
    private ClubResponse mapClubToClubResponse(Club club) {
        ClubResponse response = new ClubResponse();
        response.id = club.getId();
        response.name = club.getName();
        response.description = club.getDescription();
        response.profilePictureUrl = club.getProfilePictureUrl();

        // Üye listesini çevirerek sonsuz döngüyü kırıyoruz.
        if (club.getMembers() != null) {
            response.members = club.getMembers().stream().map(member -> {
                UserInClubResponse userDto = new UserInClubResponse();
                userDto.userId = member.getUser().getId();
                userDto.name = member.getUser().getName();
                userDto.profilePictureUrl = member.getUser().getProfilePictureUrl();
                userDto.role = member.getRole();
                return userDto;
            }).collect(Collectors.toList());
        }
        return response;
    }
}