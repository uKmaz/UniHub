package com.unihub.api.controller.requests;

import jakarta.validation.constraints.Size;

// Bu DTO, kullanıcı profilini güncellerken hangi alanların değiştirilebileceğini tanımlar.
public class UserProfileUpdateRequest {

    // Kural: İsim en az 2 karakter olmalıdır.
    @Size(min = 2, message = "İsim en az 2 karakter olmalıdır.")
    public String name;

    // Kural: Soyisim en az 2 karakter olmalıdır.
    @Size(min = 2, message = "Soyisim en az 2 karakter olmalıdır.")
    public String surname;

    public String profilePictureUrl;
}