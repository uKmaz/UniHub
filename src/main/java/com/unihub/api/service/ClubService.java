package com.unihub.api.service;

import com.unihub.api.model.Club;
import com.unihub.api.repository.ClubRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service // Bu sınıfın iş mantığı katmanı olduğunu belirtir.
public class ClubService {

    private final ClubRepository clubRepository;

    @Autowired // Spring'in ClubRepository nesnesini otomatik olarak buraya enjekte etmesini sağlar.
    public ClubService(ClubRepository clubRepository) {
        this.clubRepository = clubRepository;
    }

    // Tüm kulüpleri getiren bir metod
    public List<Club> getAllClubs() {
        return clubRepository.findAll();
    }

    // Yeni bir kulüp oluşturan bir metod
    public Club createClub(Club club) {
        // İleride burada kontroller olacak (örn: aynı isimde kulüp var mı?)
        return clubRepository.save(club);
    }
}