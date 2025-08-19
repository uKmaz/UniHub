package com.unihub.api.controller.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

// Kulüp oluştururken istemciden hangi bilgilerin alınacağını tanımlayan DTO.
public class ClubCreationRequest {
    @NotBlank(message = "Kulüp adı boş olamaz.")
    @Size(min = 3, max = 50, message = "Kulüp adı 3 ile 50 karakter arasında olmalıdır.")
    public String name;

    @NotBlank(message = "Kulüp kısaltması boş olamaz.")
    @Size(min = 2, max = 10, message = "Kulüp kısaltması 2 ile 10 karakter arasında olmalıdır.")
    public String shortName;

    @NotBlank(message = "Açıklama boş olamaz.")
    @Size(min = 10, max = 500, message = "Açıklama 10 ile 500 karakter arasında olmalıdır.")
    public String description;

    public String profilePictureUrl;
    public String university;
    public String faculty;
    public String department;
}
