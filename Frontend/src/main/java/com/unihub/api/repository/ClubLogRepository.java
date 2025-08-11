package com.unihub.api.repository;

import com.unihub.api.model.ClubLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClubLogRepository extends JpaRepository<ClubLog, Long> {
    // Bir kulübün tüm loglarını en yeniden eskiye doğru getirir
    List<ClubLog> findByClubIdOrderByTimestampDesc(Long clubId);
}