package com.unihub.api.controller.responses;

import com.unihub.api.model.PostImage;

import java.time.LocalDateTime;
import java.util.List;

public class PostDetailResponse {
    public Long id;
    public String description;
    public List<PostImage> pictureURLs;
    public LocalDateTime creationDate;
    public ClubSummaryResponse club;
    public UserSummaryResponse creator;
}