package com.unihub.api.controller.responses;
import lombok.Data;


@Data
public class ClubSummaryResponse {

    public Long id;
    public String name;
    public String shortName;
    public String profilePictureUrl;
    public String university;
    public String faculty;
    public String department;
}