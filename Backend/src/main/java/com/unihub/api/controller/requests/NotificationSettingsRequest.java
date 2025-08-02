package com.unihub.api.controller.requests;

import jakarta.validation.constraints.NotNull;

public class NotificationSettingsRequest {
    @NotNull
    public Boolean eventNotificationsEnabled;

    @NotNull
    public Boolean postNotificationsEnabled;
}