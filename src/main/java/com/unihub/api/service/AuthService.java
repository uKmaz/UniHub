package com.unihub.api.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.unihub.api.controller.requests.UserSyncRequest; // Import DTO
import com.unihub.api.model.User;
import com.unihub.api.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ...
    public User syncNewUser(String firebaseUid, UserSyncRequest request) throws FirebaseAuthException {
        UserRecord userRecord = FirebaseAuth.getInstance().getUser(firebaseUid);

        if (userRepository.findByEmail(userRecord.getEmail()).isPresent()) {
            throw new IllegalStateException("User with this email already exists.");
        }

        User newUser = new User();
        newUser.setFirebaseUid(firebaseUid);
        newUser.setEmail(userRecord.getEmail());         // From Firebase
        newUser.setName(userRecord.getDisplayName());    // From Firebase
        newUser.setProfilePictureUrl(userRecord.getPhotoUrl()); // From Firebase
        newUser.setStudentID(request.studentID);       // From Request Body
        newUser.setSurname(request.surname);         // From Request Body

        return userRepository.save(newUser);
    }

}