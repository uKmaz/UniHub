package com.unihub.api.repository;

import com.unihub.api.model.Event;
import com.unihub.api.model.EventAttendee;
import com.unihub.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventAttendeeRepository extends JpaRepository<EventAttendee, Long> {
    boolean existsByUserAndEvent(User user, Event event);
    Optional<EventAttendee> findByUserAndEvent(User user, Event event);
    Optional<EventAttendee> findAllByEvent(Event event);
    @Modifying
    @Query("DELETE FROM EventAttendee ea WHERE ea.user.id = :userId AND ea.event.club.id = :clubId")
    void deleteByUserIdAndEventClubId(Long userId, Long clubId);
}