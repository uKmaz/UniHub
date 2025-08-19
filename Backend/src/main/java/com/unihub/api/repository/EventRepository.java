package com.unihub.api.repository;

import com.unihub.api.model.Event;
import org.springframework.data.domain.Pageable;
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
    List<Event> findByClubIdInAndEventDateAfter(List<Long> clubIds, LocalDateTime now, Pageable pageable);
    List<Event> findAllByEventDateAfter(LocalDateTime now, Pageable pageable);

    List<Event> findByClubIdNotInAndEventDateAfter(List<Long> clubIds, LocalDateTime now, Pageable pageable);
    List<Event> findByEventDateAfter(LocalDateTime dateTime, Sort sort);

    List<Event> findByEventDateBefore(LocalDateTime dateTime, Sort sort);

    List<Event> findByClubId(Long clubId);
}