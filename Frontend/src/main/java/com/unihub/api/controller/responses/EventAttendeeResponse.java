package com.unihub.api.controller.responses;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class EventAttendeeResponse {
    private UserSummaryResponse user;
    private LocalDateTime joinedAt;
    private List<AnswerResponse> formAnswers;
}