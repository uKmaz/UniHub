package com.unihub.api.controller.responses;

import lombok.Data;
import java.util.List;

@Data
public class EventSubmissionResponse {
    private String questionText;
    private List<UserAnswer> userAnswers;

    @Data
    public static class UserAnswer {
        private String userName;
        private String answerText;
    }
}