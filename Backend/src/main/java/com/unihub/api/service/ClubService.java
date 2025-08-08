package com.unihub.api.service;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;
import com.unihub.api.controller.requests.ClubCreationRequest;
import com.unihub.api.controller.requests.ClubUpdateRequest;
import com.unihub.api.controller.requests.NotificationSettingsRequest;
import com.unihub.api.controller.responses.*;
import com.unihub.api.model.*;
import com.unihub.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import java.util.*;
import java.util.stream.Collectors;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;



@Service
public class ClubService {
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ClubLogRepository clubLogRepository;
    private final LogService logService;
    private final StorageClient storageClient;
    private final EventAttendeeRepository eventAttendeeRepository;

    private static final String DEFAULT_CLUB_PICTURE_URL = "https://firebasestorage.googleapis.com/v0/b/unihub-aea98.firebasestorage.app/o/public%2FunihubDefaultClubPicture.png?alt=media&token=da5a2205-c01d-4aaa-b0db-54bfe4727943";

    public ClubService(ClubRepository clubRepository, UserRepository userRepository,
                       ClubMemberRepository clubMemberRepository, LogService logService,
                       ClubLogRepository clubLogRepository,  StorageClient storageClient,
                       EventAttendeeRepository eventAttendeeRepository) {
        this.clubRepository = clubRepository;
        this.userRepository = userRepository;
        this.clubMemberRepository = clubMemberRepository;
        this.clubLogRepository = clubLogRepository;
        this.logService = logService;
        this.storageClient = storageClient;
        this.eventAttendeeRepository = eventAttendeeRepository;
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
        if (clubRepository.existsByShortName(request.shortName)) {
            throw new IllegalStateException("Bu kulüp kısaltması zaten kullanılıyor.");
        }
        User creator = userRepository.findByFirebaseUid(creatorFirebaseUid)
                .orElseThrow(() -> new RuntimeException("Creator user not found."));

        Club newClub = new Club();
        newClub.setName(request.name);
        newClub.setShortName(request.shortName);
        newClub.setDescription(request.description);
        newClub.setUniversity(request.university);
        newClub.setFaculty(request.faculty);
        newClub.setDepartment(request.department);
        newClub.setColor(generateRandomHexColor());

        newClub.setProfilePictureUrl(DEFAULT_CLUB_PICTURE_URL);

        Club savedClub = clubRepository.save(newClub);

        ClubMember membership = new ClubMember();
        membership.setClub(savedClub);
        membership.setUser(creator);
        membership.setRole(Role.OWNER);
        membership.setStatus(MembershipStatus.APPROVED);
        clubMemberRepository.save(membership);
        String adminName = membership.getUser().getName(); // İşlemi yapanın adını al
        String action = String.format("'%s', Kulübü oluşturdu.", adminName);
        logService.logClubAction(membership.getClub().getId(), creatorFirebaseUid, action);
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
        response.shortName = club.getShortName();
        response.description = club.getDescription();
        response.university = club.getUniversity();
        response.faculty = club.getFaculty();
        response.department = club.getDepartment();
        response.profilePictureUrl = club.getProfilePictureUrl();


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

        response.members = club.getMembers().stream()
                .map(this::mapMemberToUserInClubResponse).collect(Collectors.toList());

        response.posts = club.getPosts().stream()
                .sorted(Comparator.comparing(Post::getCreationDate).reversed())
                .map(post -> mapPostToSummaryDto(post, currentUser.getId()))
                .collect(Collectors.toList());

        if (club.getEvents() != null) {
            response.events = club.getEvents().stream()
                    .sorted(Comparator.comparing(Event::getEventDate).reversed())
                    .map(this::mapEventToSummaryDto)
                    .collect(Collectors.toList());
        }

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

    @Transactional
    public void manageJoinRequest(Long clubId, Long userIdToManage, boolean approve, String adminFirebaseUid) {
        ClubMember adminMembership = findMembership(adminFirebaseUid, clubId, Role.OWNER, Role.MANAGER);
        ClubMember request = clubMemberRepository.findByClubIdAndUserId(clubId, userIdToManage)
                .orElseThrow(() -> new RuntimeException("Membership request not found."));
        String adminName = adminMembership.getUser().getName(); // İşlemi yapanın adını al

        if (approve) {
            request.setStatus(MembershipStatus.APPROVED);
            clubMemberRepository.save(request);
            // --- LOGLAMA ---
            String action = String.format("'%s', '%s' adlı kullanıcının üyelik isteğini onayladı.", adminName, request.getUser().getName());
            logService.logClubAction(clubId, adminFirebaseUid, action);
        } else {
            String rejectedUserName = request.getUser().getName();
            clubMemberRepository.delete(request);
            // --- LOGLAMA ---
            String action = String.format("'%s', '%s' adlı kullanıcının üyelik isteğini reddetti.", adminName, rejectedUserName);
            logService.logClubAction(clubId, adminFirebaseUid, action);
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

        String adminName = adminMembership.getUser().getName(); // İşlemi yapanın adını al
        String removedUserName = memberToRemove.getUser().getName();
        clubMemberRepository.delete(memberToRemove);

        // --- LOGLAMA ---
        String action = String.format("'%s', '%s' adlı üyeyi kulüpten attı.", adminName, removedUserName);
        logService.logClubAction(clubId, adminFirebaseUid, action);
    }

    @Transactional
    public void promoteMember(Long clubId, Long userIdToPromote, String adminFirebaseUid) {
        ClubMember adminMembership = findMembership(adminFirebaseUid, clubId, Role.OWNER);
        ClubMember memberToPromote = clubMemberRepository.findByClubIdAndUserId(clubId, userIdToPromote)
                .orElseThrow(() -> new RuntimeException("Member to promote not found."));

        if (memberToPromote.getRole() != Role.MEMBER) {
            throw new IllegalStateException("Only members can be promoted to manager.");
        }

        memberToPromote.setRole(Role.MANAGER);
        clubMemberRepository.save(memberToPromote);

        // --- LOGLAMA ---
        String adminName = adminMembership.getUser().getName(); // İşlemi yapanın adını al
        String action = String.format("'%s', '%s' adlı üyeyi 'MANAGER' rolüne terfi ettirdi.", adminName, memberToPromote.getUser().getName());
        logService.logClubAction(clubId, adminFirebaseUid, action);
    }

    @Transactional
    public ClubResponse updateClubDetails(Long clubId, ClubUpdateRequest request, String adminFirebaseUid) {
        ClubMember adminMembership = findMembership(adminFirebaseUid, clubId, Role.OWNER);

        Club clubToUpdate = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found."));

        // Eski fotoğraf URL'ini al
        String oldPhotoUrl = clubToUpdate.getProfilePictureUrl();

        // Kısaltma ve isim/açıklama güncellemeleri
        if (request.shortName != null && !request.shortName.equals(clubToUpdate.getShortName())) {
            if (clubRepository.existsByShortName(request.shortName)) {
                throw new IllegalStateException("Bu kulüp kısaltması zaten kullanılıyor.");
            }
            clubToUpdate.setShortName(request.shortName);
        }
        if (request.name != null) clubToUpdate.setName(request.name);
        if (request.description != null) clubToUpdate.setDescription(request.description);

        // Fotoğraf güncelleme mantığı
        if (request.profilePictureUrl == null) {
            // Fotoğraf silinip varsayılana dönülüyor
            clubToUpdate.setProfilePictureUrl(DEFAULT_CLUB_PICTURE_URL);
        } else {
            // Yeni bir fotoğraf yükleniyor
            clubToUpdate.setProfilePictureUrl(request.profilePictureUrl);
        }

        // --- YENİ MANTIK: ESKİ FOTOĞRAFI SİLME ---
        // Eğer eski URL varsa VE varsayılan değilse VE yeni URL'den farklıysa, sil.
        if (oldPhotoUrl != null && !oldPhotoUrl.equals(DEFAULT_CLUB_PICTURE_URL) && !oldPhotoUrl.equals(request.profilePictureUrl)) {
            try {
                Bucket bucket = storageClient.bucket();
                String filePath = new URL(oldPhotoUrl).getPath()
                        .replace("/v0/b/" + bucket.getName() + "/o/", "")
                        .split("\\?")[0]
                        .replace("%2F", "/");

                filePath = URLDecoder.decode(filePath, StandardCharsets.UTF_8);

                Blob blob = bucket.get(filePath);
                if (blob != null) {
                    blob.delete();
                    System.out.println("Eski kulüp fotoğrafı silindi: " + filePath);
                }
            } catch (Exception e) {
                System.err.println("Eski kulüp fotoğrafı silinirken hata: " + e.getMessage());
            }
        }
        // ------------------------------------------

        Club updatedClub = clubRepository.save(clubToUpdate);

        // Loglama
        String adminName = adminMembership.getUser().getName();
        String profileUrlStatus = (request.profilePictureUrl != null) ? "Değiştirildi" : "Güncellenmedi veya silindi";
        String action = String.format("'%s', Kulübü güncelledi. İsim: %s, Açıklama: %s, Profil fotoğrafı: %s",
                adminName, request.name, request.description, profileUrlStatus);
        logService.logClubAction(clubId, adminFirebaseUid, action);

        return mapClubToClubResponse(updatedClub, userRepository.findByFirebaseUid(adminFirebaseUid).get().getId());
    }

    public List<ClubLogResponse> getClubLogs(Long clubId, String adminFirebaseUid) {
        // Yetki Kontrolü
        findMembership(adminFirebaseUid, clubId, Role.OWNER, Role.MANAGER);

        return clubLogRepository.findByClubIdOrderByTimestampDesc(clubId).stream()
                .map(log -> {
                    ClubLogResponse response = new ClubLogResponse();
                    response.setId(log.getId()); // <-- BU SATIRI EKLE
                    response.setActorName(log.getActor().getName());
                    response.setAction(log.getAction());
                    response.setTimestamp(log.getTimestamp());
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteClubLog(Long clubId, Long logId, String ownerFirebaseUid) {
        // Yetki Kontrolü: Bu işlemi sadece ve sadece kulübün OWNER'ı yapabilir.
        findMembership(ownerFirebaseUid, clubId, Role.OWNER);

        // Logun gerçekten bu kulübe ait olduğunu doğrula (ekstra güvenlik)
        ClubLog logToDelete = clubLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Log not found."));

        if (!logToDelete.getClub().getId().equals(clubId)) {
            throw new SecurityException("Log does not belong to this club.");
        }

        clubLogRepository.delete(logToDelete);
    }

    @Transactional
    public void leaveClub(Long clubId, String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));

        ClubMember membership = clubMemberRepository.findByClubIdAndUserId(clubId, user.getId())
                .orElseThrow(() -> new RuntimeException("User is not a member of this club."));

        // KURAL: OWNER rolündeki bir kullanıcı kulüpten ayrılamaz.
        if (membership.getRole() == Role.OWNER) {
            throw new IllegalStateException("Kulüp sahibi kulüpten ayrılamaz. Lütfen önce sahipliği devredin veya kulübü silin.");
        }

        // 1. Kullanıcının, bu kulübün etkinliklerine olan tüm katılımlarını sil.
        eventAttendeeRepository.deleteByUserIdAndEventClubId(user.getId(), clubId);

        // 2. Kullanıcının üyelik kaydını sil.
        clubMemberRepository.delete(membership);

        // 3. Loglama
        String action = String.format("'%s' kulüpten ayrıldı.", user.getName());
        logService.logClubAction(clubId, firebaseUid, action);
    }

    public List<ClubSummaryResponse> searchClubs(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return clubRepository.searchByNameOrShortName(searchTerm).stream()
                .map(this::mapClubToSummaryResponse) // Basit bir DTO'ya çevir
                .collect(Collectors.toList());
    }

    public Map<String, List<ClubSummaryResponse>> getDiscoveryData(String university, String faculty, String department) {
        Map<String, List<ClubSummaryResponse>> discoveryData = new HashMap<>();

        List<ClubSummaryResponse> topByMembers = clubRepository.findFilteredAndSortedClubs(university, faculty, department, "memberCount", 5)
                .stream().map(this::mapClubToSummaryResponse).collect(Collectors.toList());

        List<ClubSummaryResponse> topByEvents = clubRepository.findFilteredAndSortedClubs(university, faculty, department, "eventCount", 5)
                .stream().map(this::mapClubToSummaryResponse).collect(Collectors.toList());

        List<ClubSummaryResponse> randomClubs = clubRepository.findFilteredAndSortedClubs(university, faculty, department, "random", 5)
                .stream().map(this::mapClubToSummaryResponse).collect(Collectors.toList());

        discoveryData.put("topByMembers", topByMembers);
        discoveryData.put("topByEvents", topByEvents);
        discoveryData.put("randomClubs", randomClubs);

        return discoveryData;
    }

    // --- YARDIMCI METODLAR ---

    private ClubSummaryResponse mapClubToSummaryResponse(Club club) {
        ClubSummaryResponse dto = new ClubSummaryResponse();
        dto.setId(club.getId());
        dto.setName(club.getName());
        dto.setShortName(club.getShortName());
        dto.setProfilePictureUrl(club.getProfilePictureUrl());
        dto.setUniversity(club.getUniversity());
        dto.setFaculty(club.getFaculty());
        dto.setDepartment(club.getDepartment());
        return dto;
    }

    private ClubResponse mapClubToClubResponse(Club club, Long currentUserId) {
        ClubResponse response = new ClubResponse();
        response.id = club.getId();
        response.name = club.getName();
        response.description = club.getDescription();
        response.shortName = club.getShortName();
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
        userDto.status = member.getStatus();
        return userDto;
    }

    private PostSummaryResponse mapPostToSummaryDto(Post post, Long currentUserId) {
        PostSummaryResponse dto = new PostSummaryResponse();
        dto.id = post.getId();
        dto.description = post.getDescription();
        dto.pictureURLs = post.getImages().stream().map(PostImage::getImageUrl).collect(Collectors.toList());
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

        if (event.getClub() != null) {
            dto.clubId = event.getClub().getId();
            dto.clubName = event.getClub().getName();
            dto.clubProfilePictureUrl = event.getClub().getProfilePictureUrl();
        }
        return dto;
    }
}