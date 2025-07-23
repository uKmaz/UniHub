package com.unihub.api.repository; // Paket adını kontrol et

import com.unihub.api.model.Event;
import org.springframework.boot.autoconfigure.data.web.SpringDataWebProperties;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository // Bu interface'in bir Spring bileşeni olduğunu belirtir (opsiyonel ama iyi bir pratik).
public interface EventRepository extends JpaRepository<Event, Long> {
    // JpaRepository<Hangi Entity, ID'nin Tipi>
    // Bu kadar! Temel CRUD (Create, Read, Update, Delete) işlemleri
    // (save(), findById(), findAll(), deleteById()) otomatik olarak geldi.
    // İleride özel sorgular gerekirse buraya ekleyeceksin.
    List<Event> findByClubIdIn(List<Long> clubIds, Pageable pageable);
    List<Event> findByClubIdNotIn(List<Long> clubIds, Pageable pageable);
}