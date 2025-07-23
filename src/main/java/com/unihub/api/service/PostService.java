package com.unihub.api.service;

import com.unihub.api.controller.requests.PostCreationRequest;
import com.unihub.api.controller.responses.*; // Import all DTOs
import com.unihub.api.model.*;
import com.unihub.api.repository.ClubMemberRepository;
import com.unihub.api.repository.ClubRepository;
import com.unihub.api.repository.PostRepository;
import com.unihub.api.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository, ClubRepository clubRepository, ClubMemberRepository clubMemberRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.clubRepository = clubRepository;
        this.clubMemberRepository = clubMemberRepository;
    }

    public List<PostSummaryResponse> getAllPosts() {
        return postRepository.findAll().stream()
                .map(this::mapPostToSummaryDto)
                .collect(Collectors.toList());
    }

    public PostDetailResponse createPostForClub(Long clubId, PostCreationRequest request, String creatorFirebaseUid) {
        // 1. Find the user creating the post.
        User creator = userRepository.findByFirebaseUid(creatorFirebaseUid)
                .orElseThrow(() -> new RuntimeException("Creator user not found."));

        // 2. AUTHORIZATION CHECK: Is this user an Officer or Admin of the club?
        clubMemberRepository.findByClubIdAndUserId(clubId, creator.getId())
                .filter(member -> member.getRole() == Role.MANAGER || member.getRole() == Role.OWNER)
                .orElseThrow(() -> new SecurityException("User is not authorized to create posts for this club."));

        // 3. Find the club.
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found."));

        // 4. Create and save the post.
        Post newPost = new Post();
        newPost.setDescription(request.description);
        newPost.setPictureURL(request.pictureURL);
        newPost.setCreator(creator);
        newPost.setClub(club);

        Post savedPost = postRepository.save(newPost);

        // 5. Return the detailed DTO of the new post.
        return mapPostToDetailDto(savedPost);
    }

    // DTO MAPPING HELPER METHODS
    private PostSummaryResponse mapPostToSummaryDto(Post post) {
        PostSummaryResponse dto = new PostSummaryResponse();
        dto.id = post.getId();
        dto.description = post.getDescription();
        dto.creationDate = post.getCreationDate();
        if (post.getClub() != null) dto.clubName = post.getClub().getName();
        if (post.getCreator() != null) dto.creatorName = post.getCreator().getName();
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
            dto.club = clubDto;
        }

        if (post.getCreator() != null) {
            UserSummaryResponse userDto = new UserSummaryResponse();
            userDto.id = post.getCreator().getId();
            userDto.name = post.getCreator().getName();
            userDto.profilePictureUrl = post.getCreator().getProfilePictureUrl();
            dto.creator = userDto;
        }

        return dto;
    }
}