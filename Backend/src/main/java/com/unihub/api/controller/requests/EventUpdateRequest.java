package com.unihub.api.controller.requests;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class EventUpdateRequest {
    @NotBlank
    @Size(min = 1, max = 500)
    public String description;

    @Future // Etkinlik tarihi geçmiş bir tarih olamaz
    public LocalDateTime eventDate;

    @Size(max = 255)
    public String location;

    public String pictureUrl;
}
