package com.unihub.api.repository;

import com.unihub.api.model.EventFormAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventFormAnswerRepository extends JpaRepository<EventFormAnswer, Long> {
}