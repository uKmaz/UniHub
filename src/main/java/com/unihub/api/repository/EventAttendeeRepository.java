package com.unihub.api.repository;

import com.unihub.api.model.Event;
import com.unihub.api.model.EventAttendee;
import com.unihub.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventAttendeeRepository extends JpaRepository<EventAttendee, Long> {
    // Kullanıcının bir etkinliğe zaten katılıp katılmadığını kontrol eder
    boolean existsByUserAndEvent(User user, Event event);
}