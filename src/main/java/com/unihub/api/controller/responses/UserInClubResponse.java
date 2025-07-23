package com.unihub.api.controller.responses;

import com.unihub.api.model.Role;

public class UserInClubResponse {
    public Long userId;
    public String name;
    public String profilePictureUrl;
    public Role role; // Üyenin kulüpteki rolü
}