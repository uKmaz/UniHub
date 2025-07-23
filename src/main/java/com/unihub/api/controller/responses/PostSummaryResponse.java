package com.unihub.api.controller.responses;

import java.time.LocalDateTime;

// For lists of posts
public class PostSummaryResponse {
    public Long id;
    public String description;
    public LocalDateTime creationDate;
    public String clubName;
    public String creatorName;
}