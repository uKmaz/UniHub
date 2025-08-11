package com.unihub.api.controller.responses;

import com.unihub.api.model.QuestionType;
import lombok.Data;

@Data
public class EventFormQuestionResponse {
    private Long id;
    private String questionText;
    private QuestionType questionType;
}