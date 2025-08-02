package com.unihub.api.controller;

import com.unihub.api.controller.requests.EventFormSubmissionRequest;
import com.unihub.api.controller.responses.EventDetailResponse;
import com.unihub.api.controller.responses.EventSubmissionResponse;
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


    // Note: Event creation is scoped under clubs
    // So the endpoint remains in ClubController for RESTful consistency.
    // If you prefer it here, you can move the createEvent method from ClubController.

    @PostMapping("/{eventId}/attend")
    public ResponseEntity<Void> attendEvent(@PathVariable Long eventId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        eventService.attendEvent(eventId, firebaseUid);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{eventId}/leave")
    public ResponseEntity<Void> leaveEvent(@PathVariable Long eventId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        eventService.leaveEvent(eventId, firebaseUid);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<EventDetailResponse> getEventById(@PathVariable Long eventId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        return ResponseEntity.ok(eventService.getEventById(eventId, firebaseUid));
    }

    @GetMapping("/upcoming")
    public List<EventSummaryResponse> getUpcomingEvents() {
        return eventService.getUpcomingEvents();
    }

    @GetMapping("/past")
    public List<EventSummaryResponse> getPastEvents() {
        return eventService.getPastEvents();
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long eventId, Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        eventService.deleteEvent(eventId, firebaseUid);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{eventId}/submit-form")
    public ResponseEntity<Void> submitEventForm(
            @PathVariable Long eventId,
            @RequestBody EventFormSubmissionRequest request,
            Authentication authentication) {
        String firebaseUid = (String) authentication.getPrincipal();
        eventService.submitEventForm(eventId, firebaseUid, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{eventId}/submissions")
    public ResponseEntity<List<EventSubmissionResponse>> getEventSubmissions(
            @PathVariable Long eventId,
            Authentication authentication) {
        String adminFirebaseUid = (String) authentication.getPrincipal();
        return ResponseEntity.ok(eventService.getEventSubmissions(eventId, adminFirebaseUid));
    }

}