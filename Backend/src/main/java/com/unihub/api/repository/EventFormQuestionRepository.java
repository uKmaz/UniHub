package com.unihub.api.repository;

import com.unihub.api.model.EventFormQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventFormQuestionRepository extends JpaRepository<EventFormQuestion, Long> {
}