package com.unihub.api.service;

import com.unihub.api.controller.requests.ClubCreationRequest;
import com.unihub.api.controller.requests.ClubUpdateRequest;
import com.unihub.api.controller.requests.NotificationSettingsRequest;
import com.unihub.api.controller.responses.*;
import com.unihub.api.model.*;
import com.unihub.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;

@Service
public class ClubService {
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final ClubMemberRepository clubMemberRepository;

    public ClubService(ClubRepository clubRepository, UserRepository userRepository, ClubMemberRepository clubMemberRepository) {
        this.clubRepository = clubRepository;
        this.userRepository = userRepository;
        this.clubMemberRepository = clubMemberRepository;
    }

    @Transactional
    public ClubResponse createClub(ClubCreationRequest request, String creatorFirebaseUid) {
        try {
            UserRecord userRecord = FirebaseAuth.getInstance().getUser(creatorFirebaseUid);
            if (!userRecord.isEmailVerified()) {
                throw new SecurityException("Kulüp oluşturmak için e-posta adresinizi doğrulamanız gerekmektedir.");
            }
        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Firebase kullanıcı bilgileri alınamadı.", e);
        }

        User creator = userRepository.findByFirebaseUid(creatorFirebaseUid)
                .orElseThrow(() -> new RuntimeException("Creator user not found."));

        Club newClub = new Club();
        newClub.setName(request.name);
        newClub.setDescription(request.description);
        newClub.setProfilePictureUrl(request.profilePictureUrl);
        newClub.setUniversity(request.university);
        newClub.setFaculty(request.faculty);
        newClub.setDepartment(request.department);
        newClub.setColor(generateRandomHexColor());

        Club savedClub = clubRepository.save(newClub);

        ClubMember membership = new ClubMember();
        membership.setClub(savedClub);
        membership.setUser(creator);
        membership.setRole(Role.OWNER);
        membership.setStatus(MembershipStatus.APPROVED);
        clubMemberRepository.save(membership);

        return mapClubToClubResponse(savedClub, creator.getId());
    }

    public ClubResponse getClubById(Long clubId, String firebaseUid) {
        User currentUser = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found with id: " + clubId));

        return mapClubToClubResponse(club, currentUser.getId());
    }

    public ClubDetailResponse getClubDetails(Long clubId, String firebaseUid) {
        User currentUser = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found with id: " + clubId));

        // Ana DTO'yu oluştur
        ClubDetailResponse response = new ClubDetailResponse();
        response.id = club.getId();
        response.name = club.getName();
        // ... diğer kulüp bilgilerini ata ...

        // Mevcut kullanıcının bu kulüpteki üyeliğini bul ve DTO'ya ekle
        club.getMembers().stream()
                .filter(member -> member.getUser().getId().equals(currentUser.getId()))
                .findFirst()
                .ifPresent(membership -> {
                    CurrentUserMembershipResponse membershipDto = new CurrentUserMembershipResponse();
                    membershipDto.role = membership.getRole();
                    membershipDto.status = membership.getStatus();
                    membershipDto.eventNotificationsEnabled = membership.isEventNotificationsEnabled();
                    membershipDto.postNotificationsEnabled = membership.isPostNotificationsEnabled();
                    response.currentUserMembership = membershipDto;
                });

        // Diğer listeleri de DTO'ya ekle
        response.members = club.getMembers().stream()
                .map(this::mapMemberToUserInClubResponse).collect(Collectors.toList());

        response.posts = club.getPosts().stream()
                .sorted(Comparator.comparing(Post::getCreationDate).reversed())
                .map(post -> mapPostToSummaryDto(post, currentUser.getId()))
                .collect(Collectors.toList());

        // ... etkinlikler için de aynı mantık ...

        return response;
    }

    public List<ClubResponse> getAllClubsAsDto(String firebaseUid) {
        User currentUser = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));

        return clubRepository.findAll()
                .stream()
                .map(club -> mapClubToClubResponse(club, currentUser.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateNotificationSettings(Long clubId, NotificationSettingsRequest request, String memberFirebaseUid) {
        ClubMember membership = findMembership(memberFirebaseUid, clubId);
        membership.setEventNotificationsEnabled(request.eventNotificationsEnabled);
        membership.setPostNotificationsEnabled(request.postNotificationsEnabled);
        clubMemberRepository.save(membership);
    }

    public List<UserInClubResponse> getPendingMembers(Long clubId, String adminFirebaseUid) {
        findMembership(adminFirebaseUid, clubId, Role.OWNER, Role.MANAGER);
        return clubMemberRepository.findByClubIdAndStatus(clubId, MembershipStatus.PENDING)
                .stream()
                .map(this::mapMemberToUserInClubResponse)
                .collect(Collectors.toList());
    }

    public void requestToJoinClub(Long clubId, String memberFirebaseUid) {
        User user = userRepository.findByFirebaseUid(memberFirebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found."));

        // Kullanıcının zaten üye olup olmadığını veya beklemede bir isteği olup olmadığını kontrol et
        boolean alreadyMemberOrPending = clubMemberRepository.existsByUserAndClub(user, club);
        if (alreadyMemberOrPending) {
            throw new IllegalStateException("User is already a member or has a pending request.");
        }

        // Yeni bir üyelik isteği oluştur (durumu PENDING)
        ClubMember newRequest = new ClubMember();
        newRequest.setUser(user);
        newRequest.setClub(club);
        newRequest.setRole(Role.MEMBER);
        newRequest.setStatus(MembershipStatus.PENDING);
        clubMemberRepository.save(newRequest);
    }

    public void manageJoinRequest(Long clubId, Long userIdToManage, boolean approve, String adminFirebaseUid) {
        // Yetki Kontrolü: Sadece OWNER veya MANAGER bu işlemi yapabilir.
        findMembership(adminFirebaseUid, clubId, Role.OWNER, Role.MANAGER);

        // Yönetilecek üyelik isteğini bul
        ClubMember request = clubMemberRepository.findByClubIdAndUserId(clubId, userIdToManage)
                .orElseThrow(() -> new RuntimeException("Membership request not found."));

        if (approve) {
            // Onaylanırsa, durumu APPROVED yap
            request.setStatus(MembershipStatus.APPROVED);
            clubMemberRepository.save(request);
        } else {
            // Reddedilirse, isteği sil (ileride kara listeye eklenebilir)
            clubMemberRepository.delete(request);
        }
    }

    @Transactional
    public void removeMember(Long clubId, Long userIdToRemove, String adminFirebaseUid) {
        ClubMember adminMembership = findMembership(adminFirebaseUid, clubId, Role.OWNER, Role.MANAGER);
        ClubMember memberToRemove = clubMemberRepository.findByClubIdAndUserId(clubId, userIdToRemove)
                .orElseThrow(() -> new RuntimeException("Member to remove not found."));
        if (memberToRemove.getRole().ordinal() >= adminMembership.getRole().ordinal()) {
            throw new SecurityException("You are not authorized to remove this member.");
        }
        clubMemberRepository.delete(memberToRemove);
    }

    @Transactional
    public void promoteMember(Long clubId, Long userIdToPromote, String adminFirebaseUid) {
        findMembership(adminFirebaseUid, clubId, Role.OWNER);
        ClubMember memberToPromote = clubMemberRepository.findByClubIdAndUserId(clubId, userIdToPromote)
                .orElseThrow(() -> new RuntimeException("Member to promote not found."));
        if (memberToPromote.getRole() != Role.MEMBER) {
            throw new IllegalStateException("Only members can be promoted to manager.");
        }
        memberToPromote.setRole(Role.MANAGER);
        clubMemberRepository.save(memberToPromote);
    }

    @Transactional
    public ClubResponse updateClubDetails(Long clubId, ClubUpdateRequest request, String adminFirebaseUid) {
        // Yetki Kontrolü: Sadece OWNER rolündeki kişi kulüp bilgilerini değiştirebilir.
        findMembership(adminFirebaseUid, clubId, Role.OWNER);

        Club clubToUpdate = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found."));

        if (request.name != null) clubToUpdate.setName(request.name);
        if (request.description != null) clubToUpdate.setDescription(request.description);
        if (request.profilePictureUrl != null) clubToUpdate.setProfilePictureUrl(request.profilePictureUrl);

        Club updatedClub = clubRepository.save(clubToUpdate);
        return mapClubToClubResponse(updatedClub, userRepository.findByFirebaseUid(adminFirebaseUid).get().getId());
    }

    // --- YARDIMCI METODLAR ---

    private ClubResponse mapClubToClubResponse(Club club, Long currentUserId) {
        ClubResponse response = new ClubResponse();
        response.id = club.getId();
        response.name = club.getName();
        response.description = club.getDescription();
        response.profilePictureUrl = club.getProfilePictureUrl();
        response.university = club.getUniversity();
        response.faculty = club.getFaculty();
        response.department = club.getDepartment();
        response.color = club.getColor();

        if (club.getMembers() != null) {
            response.members = club.getMembers().stream()
                    .map(this::mapMemberToUserInClubResponse).collect(Collectors.toList());
        }

        if (club.getPosts() != null) {
            response.posts = club.getPosts().stream()
                    .sorted(Comparator.comparing(Post::getCreationDate).reversed())
                    .map(post -> mapPostToSummaryDto(post, currentUserId))
                    .collect(Collectors.toList());
        }

        if (club.getEvents() != null) {
            response.events = club.getEvents().stream()
                    .sorted(Comparator.comparing(Event::getEventDate).reversed())
                    .map(this::mapEventToSummaryDto)
                    .collect(Collectors.toList());
        }

        return response;
    }

    private ClubMember findMembership(String firebaseUid, Long clubId, Role... allowedRoles) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));
        ClubMember membership = clubMemberRepository.findByClubIdAndUserId(clubId, user.getId())
                .orElseThrow(() -> new RuntimeException("User is not a member of this club."));
        if (allowedRoles == null || allowedRoles.length == 0) {
            return membership;
        }
        for (Role allowedRole : allowedRoles) {
            if (membership.getRole() == allowedRole) {
                return membership;
            }
        }
        throw new SecurityException("User does not have the required role for this action.");
    }

    private String generateRandomHexColor() {
        Random random = new Random();
        int red = random.nextInt(200);
        int green = random.nextInt(200);
        int blue = random.nextInt(200);
        return String.format("#%02x%02x%02x", red, green, blue);
    }

    private UserInClubResponse mapMemberToUserInClubResponse(ClubMember member) {
        UserInClubResponse userDto = new UserInClubResponse();
        userDto.userId = member.getUser().getId();
        userDto.name = member.getUser().getName();
        userDto.profilePictureUrl = member.getUser().getProfilePictureUrl();
        userDto.role = member.getRole();
        return userDto;
    }

    private PostSummaryResponse mapPostToSummaryDto(Post post, Long currentUserId) {
        PostSummaryResponse dto = new PostSummaryResponse();
        dto.id = post.getId();
        dto.description = post.getDescription();
        dto.pictureURL = post.getPictureURL();
        dto.creationDate = post.getCreationDate();
        if (post.getClub() != null) dto.clubName = post.getClub().getName();
        if (post.getCreator() != null) dto.creatorName = post.getCreator().getName();

        if (post.getLikes() != null) {
            dto.likeCount = post.getLikes().size();
            if (currentUserId != null) {
                dto.isLikedByCurrentUser = post.getLikes().stream()
                        .anyMatch(like -> like.getUser().getId().equals(currentUserId));
            }
        }
        return dto;
    }

    private EventSummaryResponse mapEventToSummaryDto(Event event) {
        EventSummaryResponse dto = new EventSummaryResponse();
        dto.id = event.getId();
        dto.description = event.getDescription();
        dto.eventDate = event.getEventDate();
        // EventSummaryResponse'a pictureURL eklenmeli
        // dto.pictureURL = event.getPictureURL();
        if (event.getClub() != null) {
            dto.clubId = event.getClub().getId();
            dto.clubName = event.getClub().getName();
            dto.clubProfilePictureUrl = event.getClub().getProfilePictureUrl();
        }
        return dto;
    }
}