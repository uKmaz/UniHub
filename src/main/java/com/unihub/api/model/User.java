package com.unihub.api.model;

import jakarta.persistence.*; // jakarta.persistence.* olarak import et
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

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
}