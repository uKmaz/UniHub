package com.unihub.api.controller.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class PostUpdateRequest {
    @NotBlank
    @Size(min = 1, max = 1000)
    public String description;

    // Not: Frontend, resimleri ayrı yönettiği için burada resim listesi almıyoruz.
    // Resim ekleme/çıkarma işlemleri ayrı endpoint'lerle daha verimli olabilir.
    // Şimdilik sadece metin güncellemeye odaklanıyoruz.
}