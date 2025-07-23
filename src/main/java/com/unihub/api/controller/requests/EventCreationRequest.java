package com.unihub.api.controller.requests;

import java.time.LocalDateTime;

// İstemciden (React Native/Postman) gelecek JSON verisini karşılamak için
// basit bir yardımcı sınıf (DTO - Data Transfer Object).
public class EventCreationRequest {
    public String description;
    public String pictureURL;
    public LocalDateTime eventDate;
    public Long userId;
}
