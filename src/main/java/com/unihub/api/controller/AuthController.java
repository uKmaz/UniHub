package com.unihub.api.controller;

import com.unihub.api.controller.requests.UserSyncRequest; // Import DTO
import com.unihub.api.model.User;
import com.unihub.api.service.AuthService;
import com.google.firebase.auth.FirebaseAuthException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody; // Import RequestBody
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(Authentication authentication, @RequestBody UserSyncRequest request) {
        String firebaseUid = (String) authentication.getPrincipal();

        try {
            User newUser = authService.syncNewUser(firebaseUid, request);
            return ResponseEntity.ok(newUser);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());

        } catch (FirebaseAuthException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching user data from Firebase.");
        }
    }
}