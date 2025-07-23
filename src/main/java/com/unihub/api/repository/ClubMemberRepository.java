package com.unihub.api.repository;

import com.unihub.api.model.Club;
import com.unihub.api.model.ClubMember;
import com.unihub.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {

    /**
     * Checks if a membership record exists for a specific user and club.
     * Used to prevent duplicate join requests.
     * @return true if a record exists, false otherwise.
     */
    boolean existsByUserAndClub(User user, Club club);

    /**
     * Finds a specific membership record by the club's ID and the user's ID.
     * This is useful for managing a specific user's membership in a specific club.
     * @return An Optional containing the ClubMember if found.
     */
    Optional<ClubMember> findByClubIdAndUserId(Long clubId, Long userId);
}