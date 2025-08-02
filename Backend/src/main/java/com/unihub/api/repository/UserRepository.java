package com.unihub.api.repository; // Paket adını kontrol et

import com.unihub.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository // Bu interface'in bir Spring bileşeni olduğunu belirtir (opsiyonel ama iyi bir pratik).
public interface UserRepository extends JpaRepository<User, Long> {
    // JpaRepository<Hangi Entity, ID'nin Tipi>
    // Bu kadar! Temel CRUD (Create, Read, Update, Delete) işlemleri
    // (save(), findById(), findAll(), deleteById()) otomatik olarak geldi.
    // İleride özel sorgular gerekirse buraya ekleyeceksin.
    Optional<User> findByEmail(String email);
    Optional<User> findByFirebaseUid(String firebaseUid);
    List<User> findByNameContainingIgnoreCase(String name);
    // YENİ METODLAR: Bu e-posta veya öğrenci no'su var mı diye kontrol eder.
    boolean existsByEmail(String email);
    boolean existsByStudentID(Long studentID);
}