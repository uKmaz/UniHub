package com.unihub.api.controller.responses;

import lombok.Data;

@Data
public class AnswerResponse {
    private String questionText;
    private String answerText;
}