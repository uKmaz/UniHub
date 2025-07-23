package com.unihub.api.controller.responses;

import com.unihub.api.model.Role;
import java.util.List;

public class ClubInUserResponse {
    public Long clubId;
    public String clubName;
    public String clubProfilePictureUrl;
    public Role userRoleInClub;
    public List<UserInClubResponse> otherMembers;
}