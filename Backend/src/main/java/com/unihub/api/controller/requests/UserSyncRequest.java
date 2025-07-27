package com.unihub.api.controller.requests;


import jakarta.validation.constraints.*;

public class UserSyncRequest {

    @NotNull(message = "Öğrenci numarası boş olamaz")
    @Min(value = 1000000000L, message = "Öğrenci numarası 10 haneli olmalıdır")
    @Max(value = 9999999999L, message = "Öğrenci numarası 10 haneli olmalıdır")
    public Long studentID;

    @NotBlank(message = "Soyisim boş olamaz")
    @Size(min = 2, message = "Soyisim en az 2 harf olmalıdır")
    public String surname;

    // Note: email, name, and profilePictureUrl are NOT needed here.
    // They will be securely retrieved from the user's Firebase token on the backend.
}