package com.unihub.api.repository; // Paket adını kontrol et

import com.unihub.api.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository // Bu interface'in bir Spring bileşeni olduğunu belirtir (opsiyonel ama iyi bir pratik).
public interface PostRepository extends JpaRepository<Post, Long> {
    // JpaRepository<Hangi Entity, ID'nin Tipi>
    // Bu kadar! Temel CRUD (Create, Read, Update, Delete) işlemleri
    // (save(), findById(), findAll(), deleteById()) otomatik olarak geldi.
    // İleride özel sorgular gerekirse buraya ekleyeceksin.
}