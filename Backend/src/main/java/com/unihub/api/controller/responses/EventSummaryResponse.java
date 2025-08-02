package com.unihub.api.controller.responses;

import java.time.LocalDateTime;

// For lists of events
public class EventSummaryResponse {
    public Long id;
    public String description;
    public LocalDateTime eventDate;
    public String clubName;
    public Long clubId;
    public String eventPictureUrl;
}