package com.unihub.api.service;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;
import com.unihub.api.controller.requests.PostCreationRequest;
import com.unihub.api.controller.responses.ClubSummaryResponse;
import com.unihub.api.controller.responses.PostDetailResponse;
import com.unihub.api.controller.responses.PostSummaryResponse;
import com.unihub.api.controller.responses.UserSummaryResponse;
import com.unihub.api.model.*;
import com.unihub.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.google.firebase.cloud.StorageClient;
import com.unihub.api.service.NotificationService;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final StorageClient storageClient;
    private final LogService  logService;
    private final NotificationService notificationService;


    private static final String FIREBASE_STORAGE_BUCKET = "unihub-aea98.firebasestorage.app";


    public PostService(PostRepository postRepository, UserRepository userRepository,
                       PostLikeRepository postLikeRepository, ClubRepository clubRepository,
                       ClubMemberRepository clubMemberRepository, StorageClient storageClient
    , LogService logService,NotificationService notificationService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.postLikeRepository = postLikeRepository;
        this.clubRepository = clubRepository;
        this.clubMemberRepository = clubMemberRepository;
        this.storageClient = storageClient;
        this.logService = logService;
        this.notificationService = notificationService;

    }

    public List<PostSummaryResponse> getAllPosts(String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));
        return postRepository.findAll().stream()
                .map(post -> mapPostToSummaryDto(post, user.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public PostDetailResponse createPostForClub(Long clubId, PostCreationRequest request, String creatorFirebaseUid) {
        User creator = userRepository.findByFirebaseUid(creatorFirebaseUid).orElseThrow(() -> new RuntimeException("User not found."));

        clubMemberRepository.findByClubIdAndUserId(clubId, creator.getId())
                .filter(member -> member.getRole() == Role.MANAGER || member.getRole() == Role.OWNER)
                .orElseThrow(() -> new SecurityException("User is not authorized to create posts for this club."));
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found."));

        Post newPost = new Post();
        newPost.setDescription(request.description);
        newPost.setCreator(creator);
        newPost.setClub(club);

        // YENİ MANTIK: Gelen URL listesinden PostImage nesneleri oluştur
        if (request.pictureURLs != null && !request.pictureURLs.isEmpty()) {
            List<PostImage> images = request.pictureURLs.stream()
                    .map(url -> new PostImage(url, newPost))
                    .collect(Collectors.toList());
            newPost.setImages(images);
        }

        Post savedPost = postRepository.save(newPost);
        new Thread(() -> notificationService.sendNewPostNotification(savedPost)).start();
        String action = String.format("'%s...' ile başlayan yeni bir gönderi oluşturdu.", request.description.substring(0, Math.min(request.description.length(), 20)));
        logService.logClubAction(clubId, creatorFirebaseUid, action);
        return mapPostToDetailDto(savedPost);
    }


    @Transactional
    public PostSummaryResponse toggleLike(Long postId, String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found."));

        // Beğeninin, post'un kendi listesinde olup olmadığını kontrol et
        Optional<PostLike> existingLike = post.getLikes().stream()
                .filter(like -> like.getUser().getId().equals(user.getId()))
                .findFirst();

        if (existingLike.isPresent()) {
            // Eğer beğeni varsa, onu post'un listesinden çıkar.
            // orphanRemoval=true sayesinde bu, veritabanından da silinecektir.
            post.getLikes().remove(existingLike.get());
        } else {
            // Eğer beğeni yoksa, yeni bir tane oluştur ve post'un listesine ekle.
            // CascadeType.ALL sayesinde bu, veritabanına da eklenecektir.
            PostLike newLike = new PostLike(user, post);
            post.getLikes().add(newLike);
        }

        // Değişikliklerin (beğeni ekleme/silme) kalıcı olması için ana Post nesnesini kaydet.
        Post updatedPost = postRepository.save(post);

        return mapPostToSummaryDto(updatedPost, user.getId());
    }

    @Transactional
    public void deletePost(Long postId, String firebaseUid) {
        User currentUser = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));

        Post postToDelete = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found."));

        // Yetki Kontrolü
        ClubMember membership = clubMemberRepository.findByClubIdAndUserId(postToDelete.getClub().getId(), currentUser.getId())
                .orElse(null);

        boolean isCreator = postToDelete.getCreator().getId().equals(currentUser.getId());
        boolean isClubManagerOrOwner = membership != null && (membership.getRole() == Role.OWNER || membership.getRole() == Role.MANAGER);

        if (!isCreator && !isClubManagerOrOwner) {
            throw new SecurityException("User is not authorized to delete this post.");
        }

        // --- NİHAİ DÜZELTME: FOTOĞRAFLARI STORAGE'DAN SİLME ---
        if (postToDelete.getImages() != null && !postToDelete.getImages().isEmpty()) {
            // Depolama alanını adıyla, açıkça çağırıyoruz.
            Bucket bucket = storageClient.bucket(FIREBASE_STORAGE_BUCKET);

            for (PostImage image : postToDelete.getImages()) {
                try {
                    // URL'den dosya yolunu doğru bir şekilde çıkar
                    URL url = new URL(image.getImageUrl());
                    String path = url.getPath();
                    // Baştaki '/v0/b/bucket-name/o/' kısmını kaldır
                    String filePath = path.substring(("/v0/b/" + FIREBASE_STORAGE_BUCKET + "/o/").length());
                    // URL kodlanmış karakterleri düzelt (örn: %2F -> /)
                    filePath = URLDecoder.decode(filePath, StandardCharsets.UTF_8);

                    Blob blob = bucket.get(filePath);
                    if (blob != null) {
                        blob.delete();
                        System.out.println("Dosya silindi: " + filePath);
                    } else {
                        System.out.println("Dosya bulunamadı: " + filePath);
                    }
                } catch (Exception e) {
                    System.err.println("Storage'dan dosya silinirken hata: " + e.getMessage());
                }
            }
        }
        // ----------------------------------------------------
        String action = String.format("'%s...' ile başlayan gönderiyi sildi.", postToDelete.getDescription().substring(0, Math.min(postToDelete.getDescription().length(), 20)));
        logService.logClubAction(postToDelete.getClub().getId(), firebaseUid, action);
        postRepository.delete(postToDelete);
    }


    // --- DTO ÇEVİRME METODLARI ---

    private PostSummaryResponse mapPostToSummaryDto(Post post, Long currentUserId) {
        PostSummaryResponse dto = new PostSummaryResponse();
        dto.id = post.getId();
        dto.description = post.getDescription();
        if (post.getImages() != null) {
            dto.pictureURLs = post.getImages().stream()
                    .map(PostImage::getImageUrl)
                    .collect(Collectors.toList());
        }
        dto.creationDate = post.getCreationDate();
        if (post.getClub() != null) dto.clubName = post.getClub().getName();
        if (post.getCreator() != null) dto.creatorName = post.getCreator().getName();

        if (post.getLikes() != null) {
            dto.likeCount = post.getLikes().size();
            dto.isLikedByCurrentUser = post.getLikes().stream()
                    .anyMatch(like -> like.getUser().getId().equals(currentUserId));
        } else {
            dto.likeCount = 0;
            dto.isLikedByCurrentUser = false;
        }
        return dto;
    }

    private PostDetailResponse mapPostToDetailDto(Post post) {
        PostDetailResponse dto = new PostDetailResponse();
        dto.id = post.getId();
        dto.description = post.getDescription();
        dto.pictureURLs = post.getImages();
        dto.creationDate = post.getCreationDate();

        if (post.getClub() != null) {
            ClubSummaryResponse clubDto = new ClubSummaryResponse();
            clubDto.id = post.getClub().getId();
            clubDto.name = post.getClub().getName();
            clubDto.profilePictureUrl = post.getClub().getProfilePictureUrl();
            dto.club = clubDto;
        }

        if (post.getCreator() != null) {
            dto.creator = mapUserToSummaryDto(post.getCreator());
        }
        return dto;
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

    // YARDIMCI METODLAR
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
}
