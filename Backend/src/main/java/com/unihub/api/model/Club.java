package com.unihub.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data // @Getter, @Setter, @ToString, @EqualsAndHashCode ve @RequiredArgsConstructor'ı içerir.
@NoArgsConstructor // Boş constructor'ı oluşturur.
@AllArgsConstructor // Tüm alanları içeren dolu constructor'ı oluşturur.
@Entity // Bu sınıfın bir veritabanı tablosuna karşılık geldiğini belirtir.
@Table(name = "clubs") // Veritabanındaki tablo adını belirtir.
public class Club {

    @Id // Bu alanın primary key olduğunu belirtir.
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID'nin otomatik olarak artmasını sağlar (PostgreSQL için IDENTITY en iyisidir).
    private Long id;

    private String name;
    private String description;
    private String university;
    private String faculty;
    private String department;
    private String profilePictureUrl; // Firebase'den gelecek URL burada saklanacak.

    @OneToMany(mappedBy = "club") // Bir kulübün BİRDEN ÇOK etkinliği olabilir.
    private List<Event> events;

    @OneToMany(mappedBy = "club")
    private List<Post> posts;

    @OneToMany(mappedBy = "club")
    private List<ClubMember> members;

    private String color;
}