package com.unihub.api.controller.requests;

import jakarta.validation.constraints.Size;

public class ClubUpdateRequest {
    @Size(min = 3, max = 50, message = "Kulüp adı 3 ile 50 karakter arasında olmalıdır.")
    public String name;

    @Size(min = 2, max = 10, message = "Kulüp kısaltması 2 ile 10 karakter arasında olmalıdır.")
    public String shortName;

    @Size(min = 10, max = 500, message = "Açıklama 10 ile 500 karakter arasında olmalıdır.")
    public String description;

    public String profilePictureUrl;

}