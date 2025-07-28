package com.unihub.api.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.unihub.api.controller.requests.UserProfileUpdateRequest;
import com.unihub.api.controller.responses.ClubInUserResponse;
import com.unihub.api.controller.responses.UserInClubResponse;
import com.unihub.api.controller.responses.UserResponse;
import com.unihub.api.controller.responses.UserSummaryResponse;
import com.unihub.api.model.*; // Role ve MembershipStatus için
import com.unihub.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.stream.Collectors;

import static com.unihub.api.service.AuthService.DEFAULT_USER_PICTURE_URL;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapUserToSummaryDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserProfileById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return mapUserToUserResponse(user);
    }

    // Kendi profilini getirmek için firebaseUid kullanır.
    @Transactional(readOnly = true)
    public UserResponse getUserProfileByFirebaseUid(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found with firebaseUid: " + firebaseUid));

        return mapUserToUserResponse(user);
    }

    // İsimle kullanıcı arar.
    public List<UserSummaryResponse> searchUsersByName(String name) {
        return userRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(this::mapUserToSummaryDto)
                .collect(Collectors.toList());
    }

    public UserResponse updateUserProfile(String firebaseUid, UserProfileUpdateRequest request) {
        User userToUpdate = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found with firebaseUid: " + firebaseUid));


        if (request.name != null) userToUpdate.setName(request.name);
        if (request.surname != null) userToUpdate.setSurname(request.surname);
        if (request.profilePictureUrl != null) userToUpdate.setProfilePictureUrl(request.profilePictureUrl);

        User updatedUser = userRepository.save(userToUpdate);
        return mapUserToUserResponse(updatedUser);
    }

    @Transactional
    public void deleteCurrentUser(String firebaseUid) {
        User userToDelete = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User to delete not found in local DB."));
        String photoUrl = userToDelete.getProfilePictureUrl();
        if (photoUrl != null && !photoUrl.equals(DEFAULT_USER_PICTURE_URL)) {
            try {
                Storage storage = StorageOptions.getDefaultInstance().getService();
                BlobId blobId = BlobId.of("unihub-aea98.appspot.com", "profile_pictures/" + firebaseUid);
                boolean deleted = storage.delete(blobId);
                if (deleted) {
                    System.out.println("Kullanıcının profil fotoğrafı Storage'dan başarıyla silindi.");
                } else {
                    System.out.println("Kullanıcının profil fotoğrafı Storage'da bulunamadı.");
                }
            } catch (Exception e) {
                System.err.println("Storage'dan fotoğraf silinirken bir hata oluştu: " + e.getMessage());
            }
        }

        try {
            FirebaseAuth.getInstance().deleteUser(firebaseUid);
        } catch (FirebaseAuthException e) {
            // Firebase'de kullanıcı zaten silinmişse veya bir sorun olursa logla ama devam et
            System.err.println("Firebase user deletion failed, proceeding with DB deletion: " + e.getMessage());
        }

        userRepository.delete(userToDelete);
    }

    // --- YARDIMCI METODLAR (Kod tekrarını önlemek için) ---
    private UserResponse mapUserToUserResponse(User user) {
        UserResponse userResponse = new UserResponse();
        userResponse.id = user.getId();
        userResponse.studentID = user.getStudentID();
        userResponse.email = user.getEmail();
        userResponse.name = user.getName();
        userResponse.surname = user.getSurname();
        userResponse.profilePictureUrl = user.getProfilePictureUrl();

        if (user.getMemberships() != null) {
            userResponse.memberships = user.getMemberships().stream()
                    .filter(membership -> membership.getStatus() == MembershipStatus.APPROVED)
                    .map(this::mapMembershipToClubInUserResponse)
                    .collect(Collectors.toList());
        }
        return userResponse;
    }

    private ClubInUserResponse mapMembershipToClubInUserResponse(ClubMember membership) {
        Club club = membership.getClub();
        ClubInUserResponse clubDto = new ClubInUserResponse();
        clubDto.clubId = club.getId();
        clubDto.clubName = club.getName();
        clubDto.clubProfilePictureUrl = club.getProfilePictureUrl();
        clubDto.userRoleInClub = membership.getRole();
        clubDto.eventNotificationsEnabled = membership.isEventNotificationsEnabled();
        clubDto.postNotificationsEnabled = membership.isPostNotificationsEnabled();

        if (club.getMembers() != null) {
            clubDto.otherMembers = club.getMembers().stream()
                    .filter(otherMember -> !otherMember.getUser().getId().equals(membership.getUser().getId()))
                    .map(this::mapMemberToUserInClubResponse)
                    .collect(Collectors.toList());
        }
        return clubDto;
    }

    private UserInClubResponse mapMemberToUserInClubResponse(ClubMember member) {
        UserInClubResponse memberDto = new UserInClubResponse();
        memberDto.userId = member.getUser().getId();
        memberDto.name = member.getUser().getName();
        memberDto.profilePictureUrl = member.getUser().getProfilePictureUrl();
        memberDto.role = member.getRole();
        return memberDto;
    }

    private UserSummaryResponse mapUserToSummaryDto(User user) {
        UserSummaryResponse dto = new UserSummaryResponse();
        dto.id = user.getId();
        dto.studentID = user.getStudentID();
        dto.name = user.getName();
        dto.surname = user.getSurname();
        dto.profilePictureUrl = user.getProfilePictureUrl();
        return dto;
    }

    @Transactional
    public void deleteUser(String firebaseUid) {
        // 1. Önce PostgreSQL'deki kullanıcıyı bul.
        User userToDelete = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found in local DB."));

        // 2. Firebase Authentication'dan kullanıcıyı sil.
        try {
            FirebaseAuth.getInstance().deleteUser(firebaseUid);
        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Failed to delete user from Firebase.", e);
        }

        // 3. Son olarak PostgreSQL'den kullanıcıyı sil.
        // Yukarıda ayarladığımız "cascade" sayesinde, bu komut çalıştığı an
        // bu kullanıcıya ait TÜM üyelikler, beğeniler, gönderiler vb. de otomatik olarak silinecektir.
        userRepository.delete(userToDelete);
    }
}