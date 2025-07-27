package com.unihub.api.service;

import com.unihub.api.controller.requests.PostCreationRequest;
import com.unihub.api.controller.responses.*;
import com.unihub.api.model.*;
import com.unihub.api.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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

    public PostService(PostRepository postRepository, UserRepository userRepository, ClubRepository clubRepository, ClubMemberRepository clubMemberRepository, PostLikeRepository postLikeRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.clubRepository = clubRepository;
        this.clubMemberRepository = clubMemberRepository;
        this.postLikeRepository = postLikeRepository;
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
        User creator = userRepository.findByFirebaseUid(creatorFirebaseUid)
                .orElseThrow(() -> new RuntimeException("Creator user not found."));

        clubMemberRepository.findByClubIdAndUserId(clubId, creator.getId())
                .filter(member -> member.getRole() == Role.MANAGER || member.getRole() == Role.OWNER)
                .orElseThrow(() -> new SecurityException("User is not authorized to create posts for this club."));

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found."));

        Post newPost = new Post();
        newPost.setDescription(request.description);
        newPost.setPictureURL(request.pictureURL);
        newPost.setCreator(creator);
        newPost.setClub(club);
        newPost.setLikes(new ArrayList<>()); // Başlangıçta boş bir liste ata

        Post savedPost = postRepository.save(newPost);
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

    // --- DTO ÇEVİRME METODLARI ---
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
        dto.pictureURL = post.getPictureURL();
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
}
