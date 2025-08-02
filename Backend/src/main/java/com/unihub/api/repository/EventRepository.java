package com.unihub.api.repository;

import com.unihub.api.model.Event;
import org.springframework.data.domain.Sort; // -> Sort'u import et
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime; // -> LocalDateTime'ı import et
import java.util.List;         // -> List'i import et

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    // Bu metodları FeedService kullanıyor
    List<Event> findByClubIdIn(List<Long> clubIds, org.springframework.data.domain.Pageable pageable);
    List<Event> findByClubIdNotIn(List<Long> clubIds, org.springframework.data.domain.Pageable pageable);

    // --- YENİ EKLENEN METODLAR ---

    /**
     * Verilen tarihten SONRAKİ tüm etkinlikleri bulur.
     * @param dateTime Karşılaştırma yapılacak tarih ve saat.
     * @param sort Sıralama kriteri (örn: tarihe göre artan).
     * @return Etkinlik listesi.
     */
    List<Event> findByEventDateAfter(LocalDateTime dateTime, Sort sort);

    /**
     * Verilen tarihten ÖNCEKİ tüm etkinlikleri bulur.
     * @param dateTime Karşılaştırma yapılacak tarih ve saat.
     * @param sort Sıralama kriteri (örn: tarihe göre azalan).
     * @return Etkinlik listesi.
     */
    List<Event> findByEventDateBefore(LocalDateTime dateTime, Sort sort);
}