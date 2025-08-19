package com.unihub.api.controller.responses;

import lombok.Data;

import java.util.List;

@Data
public class UserResponse {
    public Long id;
    public Long studentID;
    public String email;
    public String name;
    public String surname;
    public String profilePictureUrl;
    public List<ClubInUserResponse> memberships;
    public String university;
    public String faculty;
    public String department;
    public List<EventSummaryResponse> upcomingAttendedEvents;
    public List<EventSummaryResponse> pastAttendedEvents;
}