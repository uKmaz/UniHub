package com.unihub.api.controller.requests;


import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserSyncRequest {

    @NotNull(message = "Öğrenci numarası boş olamaz")
    public Long studentID;

    @NotBlank(message = "Soyisim boş olamaz")
    @Size(min = 2, message = "Soyisim en az 2 harf olmalıdır")
    public String surname;
    @NotBlank
    public String university;
    @NotBlank
    public String faculty;
    @NotBlank
    public String department;
    // Note: email, name, and profilePictureUrl are NOT needed here.
    // They will be securely retrieved from the user's Firebase token on the backend.
}