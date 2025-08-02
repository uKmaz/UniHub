package com.unihub.api.service;

import com.unihub.api.controller.responses.EventSummaryResponse;
import com.unihub.api.controller.responses.PostSummaryResponse;
import com.unihub.api.model.*;
import com.unihub.api.repository.ClubMemberRepository;
import com.unihub.api.repository.EventRepository;
import com.unihub.api.repository.PostRepository;
import com.unihub.api.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class FeedService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final EventRepository eventRepository;

    public FeedService(UserRepository userRepository, PostRepository postRepository, ClubMemberRepository clubMemberRepository, EventRepository eventRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.clubMemberRepository = clubMemberRepository;
        this.eventRepository = eventRepository;
    }

    public List<EventSummaryResponse> getEventFeed(String firebaseUid, int page, int size, boolean onlyMemberClubs) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));

        List<Long> memberClubIds = user.getMemberships().stream()
                .filter(m -> m.getStatus() == MembershipStatus.APPROVED)
                .map(m -> m.getClub().getId())
                .collect(Collectors.toList());

        Pageable pageable = PageRequest.of(page, size, Sort.by("eventDate").descending());

        if (onlyMemberClubs) {
            if (memberClubIds.isEmpty()) return Collections.emptyList();
            return eventRepository.findByClubIdIn(memberClubIds, pageable).stream()
                    .map(this::mapEventToSummaryDto)
                    .collect(Collectors.toList());
        }

        List<Event> memberEvents = memberClubIds.isEmpty() ? Collections.emptyList()
                : eventRepository.findByClubIdIn(memberClubIds, pageable);

        List<Event> discoveryEvents = Collections.emptyList();
        if (memberEvents.size() < size) {
            int discoverySize = size - memberEvents.size();
            Pageable discoveryPageable = PageRequest.of(0, discoverySize, Sort.by("eventDate").descending());
            discoveryEvents = memberClubIds.isEmpty() ? eventRepository.findAll(discoveryPageable).getContent()
                    : eventRepository.findByClubIdNotIn(memberClubIds, discoveryPageable);
        }

        return Stream.concat(memberEvents.stream(), discoveryEvents.stream())
                .map(this::mapEventToSummaryDto)
                .collect(Collectors.toList());
    }

    public List<PostSummaryResponse> getPostFeed(String firebaseUid, int page, int size, boolean onlyMemberClubs) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));

        List<Long> memberClubIds = user.getMemberships().stream()
                .filter(m -> m.getStatus() == MembershipStatus.APPROVED)
                .map(m -> m.getClub().getId())
                .collect(Collectors.toList());

        Pageable pageable = PageRequest.of(page, size, Sort.by("creationDate").descending());

        // Eğer sadece üye olunan kulüpler isteniyorsa, sadece onları getir.
        if (onlyMemberClubs) {
            return postRepository.findByClubIdIn(memberClubIds, pageable).stream()
                    .map(post -> mapPostToSummaryDto(post, user.getId()))
                    .collect(Collectors.toList());
        }

        // --- Eski mantık devam ediyor ---
        List<Post> memberPosts = memberClubIds.isEmpty() ? Collections.emptyList()
                : postRepository.findByClubIdIn(memberClubIds, pageable);

        List<Post> discoveryPosts = Collections.emptyList();
        if (memberPosts.size() < size) {
            int discoverySize = size - memberPosts.size();
            Pageable discoveryPageable = PageRequest.of(0, discoverySize, Sort.by("creationDate").descending());
            discoveryPosts = memberClubIds.isEmpty() ? postRepository.findAll(discoveryPageable).getContent()
                    : postRepository.findByClubIdNotIn(memberClubIds, discoveryPageable);
        }

        return Stream.concat(memberPosts.stream(), discoveryPosts.stream())
                .map(post -> mapPostToSummaryDto(post, user.getId()))
                .collect(Collectors.toList());
    }

    private PostSummaryResponse mapPostToSummaryDto(Post post, Long currentUserId) {
        PostSummaryResponse dto = new PostSummaryResponse();
        dto.id = post.getId();
        dto.description = post.getDescription();
        dto.creationDate = post.getCreationDate();
        dto.pictureURLs = post.getImages().stream()
                .map(PostImage::getImageUrl)
                .collect(Collectors.toList());
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



    private EventSummaryResponse mapEventToSummaryDto(Event event) {
        EventSummaryResponse dto = new EventSummaryResponse();
        dto.id = event.getId();
        dto.description = event.getDescription();
        dto.eventDate = event.getEventDate();
        dto.eventPictureUrl = event.getClub().getProfilePictureUrl();
        if (event.getClub() != null) {
            dto.clubId = event.getClub().getId();
            dto.clubName = event.getClub().getName();
        }
        return dto;
    }
}