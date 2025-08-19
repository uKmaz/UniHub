package com.unihub.api.config;

import com.fasterxml.jackson.core.JsonParseException; // Add this import
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.StorageClient;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${FIREBASE_CREDENTIALS_JSON:#{null}}")
    private String firebaseCredentialsJson;

    @PostConstruct
    public void initialize() {
        try {
            InputStream serviceAccountStream;
            if (firebaseCredentialsJson != null && !firebaseCredentialsJson.isEmpty()) {
                System.out.println("LOG: Loading Firebase credentials from environment variable.");
                serviceAccountStream = new ByteArrayInputStream(firebaseCredentialsJson.getBytes(StandardCharsets.UTF_8));
            } else {
                System.out.println("LOG: Attempting to load Firebase credentials from file.");
                ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
                if (!resource.exists()) {
                    throw new IOException("Firebase service account file not found in classpath.");
                }
                serviceAccountStream = resource.getInputStream();
            }

            // Read JSON content
            String jsonContent = new String(serviceAccountStream.readAllBytes(), StandardCharsets.UTF_8);
            System.out.println("LOG: JSON content to parse: " + jsonContent);

            ObjectMapper mapper = new ObjectMapper();
            Map<String, String> jsonMap;
            try {
                jsonMap = mapper.readValue(jsonContent, new TypeReference<>() {});
            } catch (JsonParseException e) {
                System.err.println("ERROR: Failed to parse JSON: " + e.getMessage());
                System.err.println("ERROR: Problematic JSON: " + jsonContent);
                throw e;
            }
            String bucketName = jsonMap.get("project_id") + ".firebasestorage.app";
            System.out.println("LOG: Using storage bucket: " + bucketName);

            // Reset stream for credentials
            serviceAccountStream = new ByteArrayInputStream(jsonContent.getBytes(StandardCharsets.UTF_8));

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
                    .setStorageBucket(bucketName)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("LOG: Firebase App initialized successfully.");
            } else {
                System.out.println("LOG: Firebase App already initialized.");
            }
        } catch (IOException e) {
            System.err.println("ERROR: Failed to initialize Firebase: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Firebase initialization failed. Check credentials or file configuration.", e);
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