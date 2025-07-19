package com.unihub.api.controller; // Paket adını kontrol et

import com.unihub.api.model.Club;
import com.unihub.api.service.ClubService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // Bu sınıfın bir REST API controller'ı olduğunu belirtir.
@RequestMapping("/api/clubs") // Bu controller'daki tüm metodların /api/clubs yolu altında olacağını belirtir.
public class ClubController {

    private final ClubService clubService;

    @Autowired
    public ClubController(ClubService clubService) {
        this.clubService = clubService;
    }

    // GET http://localhost:8080/api/clubs
    @GetMapping
    public List<Club> getAllClubs() {
        return clubService.getAllClubs();
    }

    // POST http://localhost:8080/api/clubs
    @PostMapping
    public Club createClub(@RequestBody Club club) {
        // @RequestBody, gelen JSON verisini Club nesnesine çevirir.
        return clubService.createClub(club);
    }
}