package com.unihub.api.controller.responses;

import java.util.List;

public class ClubResponse {
    public Long id;
    public String name;
    public String description;
    public String profilePictureUrl;
    public List<UserInClubResponse> members; // Üyelerin listesi
}