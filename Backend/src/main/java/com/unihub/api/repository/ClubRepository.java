package com.unihub.api.repository; // Paket adını kontrol et

import com.unihub.api.model.Club;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository // Bu interface'in bir Spring bileşeni olduğunu belirtir (opsiyonel ama iyi bir pratik).
public interface ClubRepository extends JpaRepository<Club, Long> {
    @Override
    @EntityGraph(attributePaths = {"members.user", "posts.creator", "posts.likes.user", "events.creator"})
    Optional<Club> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"members.user"}) // Liste için daha az veri çekelim
    List<Club> findAll();
}