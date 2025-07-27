package com.unihub.api.service;

import com.unihub.api.controller.requests.EventCreationRequest;
import com.unihub.api.controller.responses.*;
import com.unihub.api.model.*;
import com.unihub.api.repository.*;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final EventAttendeeRepository eventAttendeeRepository;

    public EventService(EventRepository eventRepository, UserRepository userRepository, ClubRepository clubRepository, ClubMemberRepository clubMemberRepository, EventAttendeeRepository eventAttendeeRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.clubRepository = clubRepository;
        this.clubMemberRepository = clubMemberRepository;
        this.eventAttendeeRepository = eventAttendeeRepository;
    }

    public List<EventSummaryResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(this::mapEventToSummaryDto)
                .collect(Collectors.toList());
    }

    public EventDetailResponse getEventById(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));
        return mapEventToDetailDto(event);
    }

    @Transactional
    public EventDetailResponse createEventForClub(Long clubId, EventCreationRequest request, String creatorFirebaseUid) {
        User creator = userRepository.findByFirebaseUid(creatorFirebaseUid)
                .orElseThrow(() -> new RuntimeException("Creator user not found."));

        // AUTHORIZATION CHECK
        clubMemberRepository.findByClubIdAndUserId(clubId, creator.getId())
                .filter(member -> member.getRole() == Role.MANAGER || member.getRole() == Role.OWNER)
                .orElseThrow(() -> new SecurityException("User is not authorized to create events for this club."));

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found."));

        Event newEvent = new Event();
        newEvent.setDescription(request.description);
        newEvent.setPictureURL(request.pictureURL);
        newEvent.setEventDate(request.eventDate);
        newEvent.setCreator(creator);
        newEvent.setClub(club);
        Event savedEvent = eventRepository.save(newEvent);

        return mapEventToDetailDto(savedEvent);
    }

    @Transactional
    public void attendEvent(Long eventId, String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found."));

        if (eventAttendeeRepository.existsByUserAndEvent(user, event)) {
            throw new IllegalStateException("User is already attending this event.");
        }

        EventAttendee attendance = new EventAttendee();
        attendance.setUser(user);
        attendance.setEvent(event);
        eventAttendeeRepository.save(attendance);
    }

    @Transactional
    public void leaveEvent(Long eventId, String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found."));

        EventAttendee attendance = eventAttendeeRepository.findByUserAndEvent(user, event)
                .orElseThrow(() -> new IllegalStateException("User is not attending this event."));

        eventAttendeeRepository.delete(attendance);
    }

    public List<EventSummaryResponse> getUpcomingEvents() {
        return eventRepository.findByEventDateAfter(LocalDateTime.now(), Sort.by("eventDate").ascending())
                .stream()
                .map(this::mapEventToSummaryDto)
                .collect(Collectors.toList());
    }


    public List<EventSummaryResponse> getPastEvents() {
        return eventRepository.findByEventDateBefore(LocalDateTime.now(), Sort.by("eventDate").descending())
                .stream()
                .map(this::mapEventToSummaryDto)
                .collect(Collectors.toList());
    }

    // DTO MAPPING HELPERS
    private EventSummaryResponse mapEventToSummaryDto(Event event) {
        EventSummaryResponse dto = new EventSummaryResponse();
        dto.id = event.getId();
        dto.description = event.getDescription();
        dto.eventDate = event.getEventDate();
        if (event.getClub() != null) {
            dto.clubId = event.getClub().getId();
            dto.clubName = event.getClub().getName();
        }
        return dto;
    }

    private EventDetailResponse mapEventToDetailDto(Event event) {
        EventDetailResponse dto = new EventDetailResponse();
        dto.id = event.getId();
        dto.description = event.getDescription();
        dto.eventDate = event.getEventDate();
        dto.pictureURL = event.getPictureURL();

        if (event.getClub() != null) {
            ClubSummaryResponse clubDto = new ClubSummaryResponse();
            clubDto.id = event.getClub().getId();
            clubDto.name = event.getClub().getName();
            clubDto.profilePictureUrl = event.getClub().getProfilePictureUrl();
            dto.club = clubDto;
        }

        if (event.getCreator() != null) {
            dto.creator = mapUserToSummaryDto(event.getCreator());
        }

        if (event.getAttendees() != null) {
            dto.attendees = event.getAttendees().stream()
                    .map(attendee -> mapUserToSummaryDto(attendee.getUser()))
                    .collect(Collectors.toList());
        }
        return dto;
    }

    private UserSummaryResponse mapUserToSummaryDto(User user) {
        UserSummaryResponse dto = new UserSummaryResponse();
        dto.id = user.getId();
        dto.studentID = user.getStudentID();
        dto.name = user.getName();
        dto.surname = user.getSurname();
        dto.profilePictureUrl = user.getProfilePictureUrl();
        return dto;
    }
}