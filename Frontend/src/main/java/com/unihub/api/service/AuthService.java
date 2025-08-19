package com.unihub.api.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.unihub.api.controller.requests.UserSyncRequest;
import com.unihub.api.model.User;
import com.unihub.api.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    public static final String DEFAULT_USER_PICTURE_URL = "https://firebasestorage.googleapis.com/v0/b/unihub-aea98.firebasestorage.app/o/public%2FunihubDefaultProfilePicture.jpg?alt=media&token=2c37a3e9-aac6-4998-8d06-acd8ecd385fd";


    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User syncNewUser(String firebaseUid, UserSyncRequest request) throws FirebaseAuthException {
        UserRecord userRecord = FirebaseAuth.getInstance().getUser(firebaseUid);

        // --- YENİ KONTROLLER ---
        // 1. Benzersizlik Kontrolleri
        if (userRepository.existsByEmail(userRecord.getEmail())) {
            throw new IllegalStateException("Bu e-posta adresi zaten kullanılıyor.");
        }
        if (userRepository.existsByStudentID(request.studentID)) {
            throw new IllegalStateException("Bu öğrenci numarası zaten kayıtlı.");
        }

        // 2. Firebase'den Gelen Verinin Kontrolü
        if (userRecord.getDisplayName() == null || userRecord.getDisplayName().length() < 2) {
            throw new IllegalArgumentException("İsim en az 2 harf olmalıdır.");
        }


        User newUser = new User();
        newUser.setFirebaseUid(firebaseUid);
        newUser.setEmail(userRecord.getEmail());
        newUser.setName(userRecord.getDisplayName());

        // --- DEĞİŞİKLİK BURADA ---
        // Firebase'den gelen fotoğraf URL'sini al, eğer yoksa (null ise) varsayılanı ata.
        String photoUrl = userRecord.getPhotoUrl() != null ? userRecord.getPhotoUrl() : DEFAULT_USER_PICTURE_URL;
        newUser.setProfilePictureUrl(photoUrl);

        newUser.setStudentID(request.studentID);
        newUser.setSurname(request.surname);

        return userRepository.save(newUser);
    }

}