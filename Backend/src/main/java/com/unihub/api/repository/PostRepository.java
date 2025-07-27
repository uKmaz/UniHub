package com.unihub.api.repository;

import com.unihub.api.model.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph; // -> YENİ IMPORT
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"likes", "likes.user", "creator", "club"})
    List<Post> findByClubIdIn(List<Long> clubIds, Pageable pageable);

    @EntityGraph(attributePaths = {"likes", "likes.user", "creator", "club"})
    List<Post> findByClubIdNotIn(List<Long> clubIds, Pageable pageable);
}
