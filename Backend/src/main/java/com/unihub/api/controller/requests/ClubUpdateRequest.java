package com.unihub.api.controller.requests;

import jakarta.validation.constraints.Size;

public class ClubUpdateRequest {
    @Size(min = 3, message = "Kulüp adı en az 3 karakter olmalıdır.")
    public String name;

    @Size(min = 10, message = "Açıklama en az 10 karakter olmalıdır.")
    public String description;

    public String profilePictureUrl;
}