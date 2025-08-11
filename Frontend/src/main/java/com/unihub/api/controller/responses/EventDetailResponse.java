package com.unihub.api.controller.responses;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class EventDetailResponse {
    public Long id;
    public String description;
    public String pictureUrl;
    public LocalDateTime eventDate;
    public String location;
    public ClubSummaryResponse club;
    public UserSummaryResponse creator;
    public boolean isCurrentUserAttending;
    public int attendeeCount;
    public boolean canCurrentUserManage;
    public boolean isCurrentUserMemberOfClub;
    public List<EventFormQuestionResponse> formQuestions;
    public List<EventAttendeeResponse> attendees;

}