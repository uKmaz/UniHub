package com.unihub.api.service;

import com.unihub.api.model.Club;
import com.unihub.api.model.ClubLog;
import com.unihub.api.model.User;
import com.unihub.api.repository.ClubLogRepository;
import com.unihub.api.repository.ClubRepository;
import com.unihub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor // Constructor injection'ı otomatik yapar
public class LogService {

    private final ClubLogRepository clubLogRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;

    public void logClubAction(Long clubId, String actorFirebaseUid, String action) {
        User actor = userRepository.findByFirebaseUid(actorFirebaseUid)
                .orElseThrow(() -> new RuntimeException("Log actor not found."));

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Log club not found."));

        ClubLog log = new ClubLog(club, actor, action);
        clubLogRepository.save(log);
    }
}