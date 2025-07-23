package com.unihub.api.controller.requests;

import java.util.List;

// Kulüp oluştururken istemciden hangi bilgilerin alınacağını tanımlayan DTO.
public class ClubCreationRequest {
    public String name;
    public String description;
    public String profilePictureUrl;
}
