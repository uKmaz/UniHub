package com.unihub.api.controller;

import com.unihub.api.controller.requests.UserProfileUpdateRequest;
import com.unihub.api.controller.responses.UserResponse;
import com.unihub.api.controller.responses.UserSummaryResponse;
import com.unihub.api.service.UserService;
import com.google.firebase.auth.FirebaseAuth;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserSummaryResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/search")
    public List<UserSummaryResponse> searchUsers(@RequestParam String name) {
        return userService.searchUsersByName(name);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        UserResponse userProfile = userService.getUserProfileByFirebaseUid(firebaseUid);
        return ResponseEntity.ok(userProfile);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable Long userId) {
        UserResponse userProfile = userService.getUserProfileById(userId);
        return ResponseEntity.ok(userProfile);
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateUserProfile(Authentication authentication, @RequestBody UserProfileUpdateRequest request) {
        String firebaseUid = (String) authentication.getPrincipal();
        try {
            // Artık email'e gerek yok, doğrudan firebaseUid'yi servise gönderiyoruz
            UserResponse updatedUser = userService.updateUserProfile(firebaseUid, request);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyAccount(Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        userService.deleteCurrentUser(firebaseUid);
        return ResponseEntity.ok().build();
    }
}