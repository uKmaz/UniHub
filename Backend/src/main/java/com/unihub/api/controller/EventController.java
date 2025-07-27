package com.unihub.api.controller;

import com.unihub.api.controller.requests.EventCreationRequest;
import com.unihub.api.controller.responses.EventDetailResponse;
import com.unihub.api.controller.responses.EventSummaryResponse;
import com.unihub.api.service.EventService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<EventSummaryResponse> getAllEvents() {
        return eventService.getAllEvents();
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<EventDetailResponse> getEventById(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getEventById(eventId));
    }

    // Note: Event creation is scoped under clubs
    // So the endpoint remains in ClubController for RESTful consistency.
    // If you prefer it here, you can move the createEvent method from ClubController.

    @PostMapping("/{eventId}/attend")
    public ResponseEntity<String> attendEvent(@PathVariable Long eventId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        eventService.attendEvent(eventId, firebaseUid);
        return ResponseEntity.ok("Successfully registered for the event.");
    }

    @DeleteMapping("/{eventId}/leave")
    public ResponseEntity<String> leaveEvent(@PathVariable Long eventId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        eventService.leaveEvent(eventId, firebaseUid);
        return ResponseEntity.ok("Successfully left the event.");
    }

    @GetMapping("/upcoming")
    public List<EventSummaryResponse> getUpcomingEvents() {
        return eventService.getUpcomingEvents();
    }

    @GetMapping("/past")
    public List<EventSummaryResponse> getPastEvents() {
        return eventService.getPastEvents();
    }
}