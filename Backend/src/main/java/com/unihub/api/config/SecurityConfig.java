package com.unihub.api.config;

import com.unihub.api.filter.FirebaseTokenFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final FirebaseTokenFilter firebaseTokenFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // API'ler için CSRF korumasını devre dışı bırakıyoruz.
                .csrf(csrf -> csrf.disable())

                // Oturumları durumsuz (stateless) yapıyoruz, çünkü her isteği token ile doğrulayacağız.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // --- EN ÖNEMLİ DÜZELTME BURADA ---
                // Kendi Firebase filtremizi, standart güvenlik filtrelerinden önce çalışacak şekilde zincire ekliyoruz.
                .addFilterBefore(firebaseTokenFilter, UsernamePasswordAuthenticationFilter.class)

                // Gelen HTTP istekleri için yetkilendirme kurallarını tanımlıyoruz.
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/auth/register").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/clubs/**").authenticated()
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}