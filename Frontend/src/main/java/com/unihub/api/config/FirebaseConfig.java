package com.unihub.api.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.StorageClient;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            // 1. Kimlik bilgisi dosyasını bir InputStream olarak yükle
            InputStream serviceAccountStream = new ClassPathResource("firebase-service-account.json").getInputStream();

            // 2. Dosyanın içeriğini bir metin olarak oku (bu, onu birden fazla kez kullanmamızı sağlar)
            String jsonContent = new String(serviceAccountStream.readAllBytes(), StandardCharsets.UTF_8);

            // 3. Metni JSON olarak ayrıştırıp içinden "project_id"yi al
            ObjectMapper mapper = new ObjectMapper();
            Map<String, String> jsonMap = mapper.readValue(jsonContent, new TypeReference<>() {});
            String projectId = jsonMap.get("project_id");

            // 4. "project_id"yi kullanarak doğru storageBucket adını oluştur
            String bucketName = projectId + ".firebasestorage.app";

            // 5. Kimlik bilgileri için metinden yeni bir InputStream oluştur
            InputStream credentialsStream = new ByteArrayInputStream(jsonContent.getBytes(StandardCharsets.UTF_8));

            // 6. Firebase'i, hem kimlik bilgileri hem de storageBucket adıyla başlat
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(credentialsStream))
                    .setStorageBucket(bucketName) // <-- EN ÖNEMLİ DÜZELTME
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
        } catch (IOException e) {
            throw new RuntimeException("Firebase başlatılamadı. firebase-service-account.json dosyasını kontrol edin.", e);
        }
    }

    @Bean
    public StorageClient firebaseStorage() {
        return StorageClient.getInstance(FirebaseApp.getInstance());
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        return FirebaseMessaging.getInstance(FirebaseApp.getInstance());
    }
}