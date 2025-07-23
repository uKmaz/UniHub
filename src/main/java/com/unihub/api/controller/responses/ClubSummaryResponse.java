package com.unihub.api.controller.responses;

/**
 * A Data Transfer Object representing a simplified summary of a Club.
 * Used for nested responses to avoid circular dependencies and keep the payload light.
 */
public class ClubSummaryResponse {

    /**
     * The unique identifier for the club.
     */
    public Long id;

    /**
     * The name of the club.
     */
    public String name;

    /**
     * The URL for the club's profile picture.
     */
    public String profilePictureUrl;
}