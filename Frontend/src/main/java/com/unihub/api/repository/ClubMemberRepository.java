package com.unihub.api.repository;

import com.unihub.api.model.Club;
import com.unihub.api.model.ClubMember;
import com.unihub.api.model.MembershipStatus;
import com.unihub.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // -> YENİ IMPORT
import java.util.Optional;

@Repository
public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {

    boolean existsByUserAndClub(User user, Club club);

    Optional<ClubMember> findByClubIdAndUserId(Long clubId, Long userId);

    List<ClubMember> findByClubIdAndStatus(Long clubId, MembershipStatus status);
}