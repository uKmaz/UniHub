package com.unihub.api.controller.requests;

import com.unihub.api.model.QuestionType;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class EventCreationRequest {
    public String description;
    public LocalDateTime eventDate;
    public List<QuestionRequest> questions;
    public String pictureUrl;
    public String location;
    @Data
    public static class QuestionRequest {
        public String questionText;
        public QuestionType questionType;

    }
}