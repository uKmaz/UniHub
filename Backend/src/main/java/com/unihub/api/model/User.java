package com.unihub.api.model;

import jakarta.persistence.*; // jakarta.persistence.* olarak import et
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Column(unique = true, nullable = false)
    private String firebaseUid;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // OTOMATİK ARTAN ID
    private Long id; // VERİTABANI YÖNETİMLİ ID

    @Column(unique = true, nullable = false) // Benzersiz ve boş olamaz
    private Long studentID; // ÖĞRENCİ NUMARASI

    @Column(unique = true, nullable = false) // Benzersiz ve boş olamaz
    private String email;

    private String name;
    private String surname;
    private String profilePictureUrl;

    // BİR KULLANICI SİLİNDİĞİNDE, TÜM ÜYELİKLERİ DE OTOMATİK OLARAK SİLİNSİN
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClubMember> memberships;

    // BİR KULLANICI SİLİNDİĞİNDE, TÜM ETKİNLİK KATILIMLARI DA SİLİNSİN
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventAttendee> attendedEvents;

}