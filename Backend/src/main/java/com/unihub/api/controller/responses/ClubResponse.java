package com.unihub.api.controller.responses;

import java.util.List;

public class ClubResponse {
    public Long id;
    public String name;
    public String description;
    public String profilePictureUrl;
    public String university;
    public String faculty;
    public String department;
    public String color;
    public List<UserInClubResponse> members;
    public List<PostSummaryResponse> posts;
    public List<EventSummaryResponse> events;

}