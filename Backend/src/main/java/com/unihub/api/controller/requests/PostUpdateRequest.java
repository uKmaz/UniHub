package com.unihub.api.controller.requests;

import com.unihub.api.model.PostImage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class PostUpdateRequest {
    @NotBlank
    @Size(min = 1, max = 1000)
    private String description;
    private List<String> pictureURLs;
    private List<String> imagesToDelete;

}