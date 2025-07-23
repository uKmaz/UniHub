package com.unihub.api.controller.responses;

import java.time.LocalDateTime;
import java.util.List;

// For a single, detailed event view
public class EventDetailResponse {
    public Long id;
    public String description;
    public LocalDateTime eventDate;
    public String pictureURL;
    public ClubSummaryResponse club; // Nested DTO for club info
    public UserSummaryResponse creator; // Nested DTO for creator info
    public List<UserSummaryResponse> attendees; // List of attendees

}