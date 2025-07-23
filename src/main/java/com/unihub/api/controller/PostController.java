package com.unihub.api.controller;

import com.unihub.api.controller.requests.PostCreationRequest;
import com.unihub.api.controller.responses.PostDetailResponse;
import com.unihub.api.controller.responses.PostSummaryResponse;
import com.unihub.api.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping("/posts")
    public List<PostSummaryResponse> getAllPosts() {
        return postService.getAllPosts();
    }

    @PostMapping("/clubs/{clubId}/posts")
    public ResponseEntity<PostDetailResponse> createPost(
            @PathVariable Long clubId,
            @RequestBody PostCreationRequest request,
            Authentication authentication) {

        String creatorFirebaseUid = (String) authentication.getPrincipal();
        PostDetailResponse newPost = postService.createPostForClub(clubId, request, creatorFirebaseUid);
        return ResponseEntity.status(201).body(newPost); // 201 Created
    }
}