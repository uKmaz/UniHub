package com.unihub.api.controller;

import com.unihub.api.controller.responses.UserResponse;
import com.unihub.api.controller.responses.UserSummaryResponse;
import org.springframework.security.core.Authentication;
import com.google.firebase.auth.FirebaseAuth;
import com.unihub.api.controller.requests.UserProfileUpdateRequest;
import com.unihub.api.model.User;
import com.unihub.api.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Gets a list of all users.
     * This should be protected and possibly paginated in a real application.
     */
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



}