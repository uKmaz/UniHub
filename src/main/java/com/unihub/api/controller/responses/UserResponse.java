package com.unihub.api.controller.responses;

import java.util.List;

public class UserResponse {
    public Long id;
    public Long studentID;
    public String email;
    public String name;
    public String surname;
    public String profilePictureUrl;
    // Kullanıcının üye olduğu kulüplerin listesi
    public List<ClubInUserResponse> memberships;
}