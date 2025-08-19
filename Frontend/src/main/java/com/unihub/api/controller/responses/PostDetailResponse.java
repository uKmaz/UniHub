package com.unihub.api.controller.responses;

import com.unihub.api.model.PostImage;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostDetailResponse {
    public Long id;
    public String description;
    public List<String> pictureURLs;
    public LocalDateTime creationDate;
    public ClubSummaryResponse club;
    public UserSummaryResponse creator;
    public int likeCount;
    public boolean isCurrentLiked;
}