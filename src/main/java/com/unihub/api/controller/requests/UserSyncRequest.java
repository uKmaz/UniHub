package com.unihub.api.controller.requests;

public class UserSyncRequest {
    /**
     * The user's student ID. This is required by our database
     * but is not provided by Firebase Auth.
     */
    public Long studentID;

    /**
     * The user's surname. This is not a standard field in Firebase Auth.
     */
    public String surname;

    // Note: email, name, and profilePictureUrl are NOT needed here.
    // They will be securely retrieved from the user's Firebase token on the backend.
}