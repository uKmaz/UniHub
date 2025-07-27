package com.unihub.api.controller.responses;

import java.time.LocalDateTime;

// For a single, detailed post view
public class PostDetailResponse {
    public Long id;
    public String description;
    public String pictureURL;
    public LocalDateTime creationDate;
    public ClubSummaryResponse club;
    public UserSummaryResponse creator;
}