package com.unihub.api.controller;

import com.unihub.api.controller.requests.PostCreationRequest;
import com.unihub.api.controller.requests.PostUpdateRequest;
import com.unihub.api.controller.responses.PostDetailResponse;
import com.unihub.api.controller.responses.PostSummaryResponse;
import com.unihub.api.service.PostService;
import jakarta.validation.Valid;
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

    @GetMapping
    public List<PostSummaryResponse> getAllPosts(Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        return postService.getAllPosts(firebaseUid);
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

    @PostMapping("/posts/{postId}/toggle-like")
    public ResponseEntity<PostSummaryResponse> toggleLike(@PathVariable Long postId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        PostSummaryResponse updatedPost = postService.toggleLike(postId, firebaseUid);
        return ResponseEntity.ok(updatedPost);
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable Long postId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        postService.deletePost(postId, firebaseUid);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<PostDetailResponse> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateRequest request, // Frontend'den gelen JSON'u bu DTO ile karşılıyoruz
            Authentication authentication) {

        String firebaseUid = (String) authentication.getPrincipal();

        // Servis katmanındaki asıl işi yapacak olan metodu çağırıyoruz
        PostDetailResponse updatedPost = postService.updatePost(postId, request, firebaseUid);

        return ResponseEntity.ok(updatedPost);
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostDetailResponse> getPostById(@PathVariable Long postId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        PostDetailResponse postDetails = postService.getPostById(postId, firebaseUid);
        return ResponseEntity.ok(postDetails);
    }
}