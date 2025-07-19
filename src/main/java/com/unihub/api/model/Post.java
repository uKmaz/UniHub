package com.unihub.api.model;

import jakarta.persistence.*;

import java.sql.Time;
import java.time.LocalDateTime;
import java.util.Date;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // @Getter, @Setter, @ToString, @EqualsAndHashCode ve @RequiredArgsConstructor'ı içerir.
@NoArgsConstructor // Boş constructor'ı oluşturur.
@AllArgsConstructor // Tüm alanları içeren dolu constructor'ı oluşturur.
@Entity // Bu sınıfın bir veritabanı tablosuna karşılık geldiğini belirtir.
@Table(name = "posts") // Veritabanındaki tablo adını belirtir.
public class Post {

    @Id // Bu alanın primary key olduğunu belirtir.
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID'nin otomatik olarak artmasını sağlar (PostgreSQL için IDENTITY en iyisidir).
    private Long id;
    @ManyToOne // Birçok post, BİR kullanıcıya ait olabilir.
    @JoinColumn(name = "user_id", nullable = false) // veritabanında bu ilişkiyi tutacak kolonun adı
    private User creator;
    private LocalDateTime creationDate;
    private String description;
    private String pictureURL; // Firebase'den gelecek URL burada saklanacak.


}