package com.unihub.api.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.unihub.api.model.Event;
import com.unihub.api.model.Post;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final FirebaseMessaging firebaseMessaging;

    public NotificationService(FirebaseMessaging firebaseMessaging) {
        this.firebaseMessaging = firebaseMessaging;
    }

    public void sendNewPostNotification(Post post) {
        List<String> tokens = post.getClub().getMembers().stream()
                .filter(member -> member.isPostNotificationsEnabled() && member.getUser().getFcmToken() != null)
                .map(member -> member.getUser().getFcmToken())
                .collect(Collectors.toList());

        if (tokens.isEmpty()) return;

        String title = post.getClub().getName();
        String body = String.format("Yeni bir gönderi paylaştı: \"%s...\"",
                post.getDescription().substring(0, Math.min(post.getDescription().length(), 50)));

        sendNotificationsToTokens(title, body, tokens);
    }

    public void sendNewEventNotification(Event event) {
        List<String> tokens = event.getClub().getMembers().stream()
                .filter(member -> member.isEventNotificationsEnabled() && member.getUser().getFcmToken() != null)
                .map(member -> member.getUser().getFcmToken())
                .collect(Collectors.toList());

        if (tokens.isEmpty()) return;

        String title = event.getClub().getName();
        String body = String.format("Yeni bir etkinlik düzenliyor: \"%s...\"",
                event.getDescription().substring(0, Math.min(event.getDescription().length(), 50)));

        sendNotificationsToTokens(title, body, tokens);
    }

    private void sendNotificationsToTokens(String title, String body, List<String> tokens) {
        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        for (String token : tokens) {
            Message message = Message.builder()
                    .setNotification(notification)
                    .setToken(token)
                    .build();
            try {
                firebaseMessaging.send(message);
                System.out.println("Bildirim başarıyla gönderildi: " + token);
            } catch (FirebaseMessagingException e) {
                System.err.println("Bildirim gönderilemedi: " + token + ", Hata: " + e.getMessage());
            }
        }
    }
}