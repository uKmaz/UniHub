package com.unihub.api.controller.requests;

import lombok.Data;
import java.util.List;

@Data
public class EventFormSubmissionRequest {
    private List<AnswerRequest> answers;

    @Data
    public static class AnswerRequest {
        private Long questionId;
        private String answerText;
    }
}