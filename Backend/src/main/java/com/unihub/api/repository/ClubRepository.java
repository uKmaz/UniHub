package com.unihub.api.repository;

import com.unihub.api.model.Club;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository // Bu interface'in bir Spring bileşeni olduğunu belirtir (opsiyonel ama iyi bir pratik).
public interface ClubRepository extends JpaRepository<Club, Long> {
    @Override
    @EntityGraph(attributePaths = {"members.user", "posts.creator", "posts.likes.user", "events", "events.creator"})
    Optional<Club> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"members.user"})
    List<Club> findAll();

    boolean existsByShortName(String shortName);

    // Arama çubuğu için: İsim veya kısaltma içinde arama yapar
    @Query("SELECT c FROM Club c WHERE lower(c.name) LIKE lower(concat('%', :searchTerm, '%')) OR lower(c.shortName) LIKE lower(concat('%', :searchTerm, '%'))")
    List<Club> searchByNameOrShortName(@Param("searchTerm") String searchTerm);

    // Filtrelenmiş ve sıralanmış kulüpleri getiren ana sorgu
    @Query(value = "SELECT c.* FROM clubs c " +
            "LEFT JOIN (SELECT club_id, COUNT(*) as member_count FROM club_members WHERE status = 'APPROVED' GROUP BY club_id) cm ON c.id = cm.club_id " +
            "LEFT JOIN (SELECT club_id, COUNT(*) as event_count FROM events GROUP BY club_id) e ON c.id = e.club_id " +
            "WHERE (:university IS NULL OR c.university = :university) " +
            "AND (:faculty IS NULL OR c.faculty = :faculty) " +
            "AND (:department IS NULL OR c.department = :department) " +
            "ORDER BY " +
            "CASE WHEN :sortBy = 'memberCount' THEN cm.member_count END DESC NULLS LAST, " +
            "CASE WHEN :sortBy = 'eventCount' THEN e.event_count END DESC NULLS LAST, " +
            "CASE WHEN :sortBy = 'random' THEN RANDOM() END " +
            "LIMIT :limit", nativeQuery = true)
    List<Club> findFilteredAndSortedClubs(
            @Param("university") String university,
            @Param("faculty") String faculty,
            @Param("department") String department,
            @Param("sortBy") String sortBy,
            @Param("limit") int limit
    );

}