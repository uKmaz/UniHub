package com.unihub.api.controller.responses;

import com.unihub.api.model.PostImage;

import java.time.LocalDateTime;
import java.util.List;

// For lists of posts
public class PostSummaryResponse {
    public Long id;
    public String description;
    public LocalDateTime creationDate;
    public List<String> pictureURLs;
    public String clubName;
    public String creatorName;
    public int likeCount;
    public boolean isLikedByCurrentUser;
}