package com.unihub.api.controller;

import com.unihub.api.controller.responses.EventSummaryResponse;
import com.unihub.api.controller.responses.PostSummaryResponse;
import com.unihub.api.service.FeedService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/feed")
public class FeedController {

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping("/posts")
    public ResponseEntity<List<PostSummaryResponse>> getPostFeed(

            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean onlyMemberClubs )
    {

        String firebaseUid = (String) authentication.getPrincipal();
        List<PostSummaryResponse> feed = feedService.getPostFeed(firebaseUid, page, size,  onlyMemberClubs);
        return ResponseEntity.ok(feed);
    }
    @GetMapping("/events")
    public ResponseEntity<List<EventSummaryResponse>> getEventFeed(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean onlyMemberClubs) {

        String firebaseUid = (String) authentication.getPrincipal();
        List<EventSummaryResponse> feed = feedService.getEventFeed(firebaseUid, page, size, onlyMemberClubs);
        return ResponseEntity.ok(feed);
    }
}