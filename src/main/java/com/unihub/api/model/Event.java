package com.unihub.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne // Birçok event, BİR kullanıcıya ait olabilir.
    @JoinColumn(name = "user_id", nullable = false)
    private User creator;

    @ManyToOne // Birçok event, BİR kulübe ait olabilir.
    @JoinColumn(name = "club_id", nullable = false) // 'events' tablosuna 'club_id' kolonu ekler.
    private Club club;

    private LocalDateTime creationDate;
    private LocalDateTime eventDate;
    private String description;
    private String pictureURL;

    @PrePersist
    protected void onCreate() {
        creationDate = LocalDateTime.now();
    }
}