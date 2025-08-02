package com.unihub.api.controller.responses;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClubLogResponse {
    public Long id;
    public String actorName;
    public String action;
    public LocalDateTime timestamp;
}