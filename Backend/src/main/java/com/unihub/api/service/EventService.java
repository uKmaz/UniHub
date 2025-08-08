package com.unihub.api.service;

import com.unihub.api.controller.requests.EventCreationRequest;
import com.unihub.api.controller.requests.EventFormSubmissionRequest;
import com.unihub.api.controller.responses.*;
import com.unihub.api.model.*;
import com.unihub.api.repository.*;
import com.unihub.api.model.EventFormQuestion;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final EventAttendeeRepository eventAttendeeRepository;
    private final EventFormQuestionRepository eventFormQuestionRepository;
    private final EventFormAnswerRepository eventFormAnswerRepository;
    private final NotificationService notificationService;

    private final LogService  logService;

    public EventService(EventRepository eventRepository, UserRepository userRepository,
                        ClubRepository clubRepository, ClubMemberRepository clubMemberRepository,
                        EventAttendeeRepository eventAttendeeRepository,  LogService logService,
                        EventFormQuestionRepository eventFormQuestionRepository, EventFormAnswerRepository eventFormAnswerRepository,
                        NotificationService notificationService) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.clubRepository = clubRepository;
        this.clubMemberRepository = clubMemberRepository;
        this.eventAttendeeRepository = eventAttendeeRepository;
        this.logService = logService;
        this.eventFormQuestionRepository = eventFormQuestionRepository;
        this.eventFormAnswerRepository = eventFormAnswerRepository;
        this.notificationService = notificationService;

    }
    @Transactional
    public void submitEventForm(Long eventId, String firebaseUid, EventFormSubmissionRequest submissionRequest) {
        User user = userRepository.findByFirebaseUid(firebaseUid).orElseThrow(() -> new RuntimeException("User not found."));
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found."));

        // Önce katılım kaydını oluştur
        EventAttendee attendee = new EventAttendee(user, event);

        // Gelen cevapları işle ve katılım kaydına bağla
        List<EventFormAnswer> answers = submissionRequest.getAnswers().stream().map(answerReq -> {
            EventFormQuestion question = eventFormQuestionRepository.findById(answerReq.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found."));

            EventFormAnswer answer = new EventFormAnswer();
            answer.setAnswerText(answerReq.getAnswerText());
            answer.setQuestion(question);
            answer.setAttendee(attendee);
            return answer;
        }).collect(Collectors.toList());

        attendee.setAnswers(answers);
        eventAttendeeRepository.save(attendee);
    }

    public List<EventSubmissionResponse> getEventSubmissions(Long eventId, String adminFirebaseUid) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found."));
        findMembership(adminFirebaseUid, event.getClub().getId(), Role.OWNER, Role.MANAGER);

        return event.getFormQuestions().stream().map(question -> {
            EventSubmissionResponse submissionResponse = new EventSubmissionResponse();
            submissionResponse.setQuestionText(question.getQuestionText());

            List<EventSubmissionResponse.UserAnswer> userAnswers = event.getAttendees().stream()
                    .flatMap(attendee -> attendee.getAnswers().stream())
                    .filter(answer -> answer.getQuestion().getId().equals(question.getId()))
                    .map(answer -> {
                        EventSubmissionResponse.UserAnswer userAnswer = new EventSubmissionResponse.UserAnswer();
                        userAnswer.setUserName(answer.getAttendee().getUser().getName());
                        userAnswer.setAnswerText(answer.getAnswerText());
                        return userAnswer;
                    }).collect(Collectors.toList());

            submissionResponse.setUserAnswers(userAnswers);
            return submissionResponse;
        }).collect(Collectors.toList());
    }

    public List<EventSummaryResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(this::mapEventToSummaryDto)
                .collect(Collectors.toList());
    }

    public EventDetailResponse getEventById(Long eventId, String firebaseUid) {
        User currentUser = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));

        return mapEventToDetailDto(event, currentUser);
    }

    @Transactional
    public EventDetailResponse createEventForClub(Long clubId, EventCreationRequest request, String creatorFirebaseUid) {
        User creator = userRepository.findByFirebaseUid(creatorFirebaseUid)
                .orElseThrow(() -> new RuntimeException("Creator user not found."));

        clubMemberRepository.findByClubIdAndUserId(clubId, creator.getId())
                .filter(member -> member.getRole() == Role.MANAGER || member.getRole() == Role.OWNER)
                .orElseThrow(() -> new SecurityException("User is not authorized to create events for this club."));


        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found."));
        Event newEvent = new Event();
        newEvent.setDescription(request.description);
        newEvent.setEventDate(request.eventDate);
        newEvent.setCreator(creator);
        newEvent.setClub(club);
        newEvent.setPictureURL(request.getPictureUrl());
        newEvent.setLocation(request.getLocation());

        EventAttendee creatorAttendance = new EventAttendee(creator, newEvent);
        newEvent.getAttendees().add(creatorAttendance);

        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            List<EventFormQuestion> questions = request.getQuestions().stream()
                    .map(q -> new EventFormQuestion(q.getQuestionText(), q.getQuestionType(), newEvent))
                    .collect(Collectors.toList());
            newEvent.setFormQuestions(questions);
        }
        club.getEvents().add(newEvent);
        Event savedEvent = eventRepository.save(newEvent);

        new Thread(() -> notificationService.sendNewEventNotification(savedEvent)).start();

        String action = String.format("'%s...' ile başlayan yeni bir etkinlik oluşturdu.", request.description.substring(0, Math.min(request.description.length(), 20)));
        logService.logClubAction(clubId, creatorFirebaseUid, action);

        return mapEventToDetailDto(savedEvent, creator);
    }

    @Transactional
    public void deleteEvent(Long eventId, String firebaseUid) {
        User currentUser = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));

        Event eventToDelete = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found."));

        // Yetki Kontrolü: Kullanıcı ya etkinliği oluşturan kişi olmalı
        // ya da kulübün OWNER veya MANAGER'ı olmalı.
        ClubMember membership = clubMemberRepository.findByClubIdAndUserId(eventToDelete.getClub().getId(), currentUser.getId())
                .orElse(null);

        boolean isCreator = eventToDelete.getCreator().getId().equals(currentUser.getId());
        boolean isClubManagerOrOwner = membership != null && (membership.getRole() == Role.OWNER || membership.getRole() == Role.MANAGER);

        if (!isCreator && !isClubManagerOrOwner) {
            throw new SecurityException("User is not authorized to delete this event.");
        }

        // --- LOGLAMA ---
        String action = String.format("'%s' adlı etkinliği sildi.", eventToDelete.getDescription().substring(0, Math.min(eventToDelete.getDescription().length(), 20)));
        logService.logClubAction(eventToDelete.getClub().getId(), firebaseUid, action);

        eventRepository.delete(eventToDelete);
    }

    @Transactional
    public void attendEvent(Long eventId, String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid).orElseThrow(() -> new RuntimeException("User not found."));
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found."));

        if (eventAttendeeRepository.existsByUserAndEvent(user, event)) {
                return;
        }

        EventAttendee attendance = new EventAttendee(user, event);
        eventAttendeeRepository.save(attendance);
    }

    @Transactional
    public void leaveEvent(Long eventId, String firebaseUid) {
        User user = userRepository.findByFirebaseUid(firebaseUid).orElseThrow(() -> new RuntimeException("User not found."));
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found."));

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

    @Transactional
    public void removeAttendee(Long eventId, Long userIdToRemove, String adminFirebaseUid) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found."));

        // Yetki Kontrolü: İşlemi yapan kişinin kulüp yöneticisi olduğundan emin ol
        findMembership(adminFirebaseUid, event.getClub().getId(), Role.OWNER, Role.MANAGER);

        User userToRemove = userRepository.findById(userIdToRemove)
                .orElseThrow(() -> new RuntimeException("Çıkarılacak kullanıcı bulunamadı."));

        // Silinecek katılım kaydını bul
        EventAttendee attendanceToRemove = eventAttendeeRepository.findByUserAndEvent(userToRemove, event)
                .orElseThrow(() -> new IllegalStateException("Kullanıcı zaten bu etkinliğe katılmıyor."));

        // Loglama (silmeden önce)
        String adminName = userRepository.findByFirebaseUid(adminFirebaseUid).get().getName();
        String removedUserName = userToRemove.getName();
        String action = String.format("'%s', '%s' adlı kullanıcıyı '%s...' etkinliğinden çıkardı.",
                adminName,
                removedUserName,
                event.getDescription().substring(0, Math.min(event.getDescription().length(), 20)));
        logService.logClubAction(event.getClub().getId(), adminFirebaseUid, action);

        // Katılım kaydını sil. Cascade ayarları sayesinde, bu işlem
        // bu katılımcının tüm form cevaplarını da otomatik olarak silecektir.
        eventAttendeeRepository.delete(attendanceToRemove);
    }

    // DTO MAPPING HELPERS
    private EventSummaryResponse mapEventToSummaryDto(Event event) {
        EventSummaryResponse dto = new EventSummaryResponse();
        dto.id = event.getId();
        dto.description = event.getDescription();
        dto.eventDate = event.getEventDate();
        dto.clubProfilePictureUrl = event.getClub().getProfilePictureUrl();
        if (event.getClub() != null) {
            dto.clubId = event.getClub().getId();
            dto.clubName = event.getClub().getName();
        }
        return dto;
    }

    private EventDetailResponse mapEventToDetailDto(Event event, User currentUser) {
        EventDetailResponse dto = new EventDetailResponse();
        dto.setId(event.getId());
        dto.setDescription(event.getDescription());
        dto.setPictureUrl(event.getPictureURL());
        dto.setEventDate(event.getEventDate());
        dto.setLocation(event.getLocation());

        if (event.getClub() != null) {
            ClubSummaryResponse clubDto = new ClubSummaryResponse();
            clubDto.setId(event.getClub().getId());
            clubDto.setName(event.getClub().getName());
            clubDto.setProfilePictureUrl(event.getClub().getProfilePictureUrl());
            dto.setClub(clubDto);
        }

        if (event.getCreator() != null) {
            dto.setCreator(mapUserToSummaryDto(event.getCreator()));
        }

        ClubMember membership = clubMemberRepository.findByClubIdAndUserId(event.getClub().getId(), currentUser.getId()).orElse(null);
        boolean canManage = membership != null && (membership.getRole() == Role.OWNER || membership.getRole() == Role.MANAGER);
        dto.setCanCurrentUserManage(canManage);
        dto.setCurrentUserMemberOfClub(membership != null && membership.getStatus() == MembershipStatus.APPROVED);

        if (event.getAttendees() != null) {
            dto.setAttendeeCount(event.getAttendees().size());
            dto.setCurrentUserAttending(event.getAttendees().stream()
                    .anyMatch(attendee -> attendee.getUser().getId().equals(currentUser.getId())));

            // Sadece yetkililer detaylı katılımcı listesini ve cevapları görür
            dto.setAttendees(new ArrayList<>()); // Önce boş bir liste oluştur
            if (canManage) {
                dto.setAttendees(event.getAttendees().stream()
                        .map(this::mapAttendeeToResponse)
                        .collect(Collectors.toList()));
            }
        } else {
            dto.setAttendeeCount(0);
            dto.setCurrentUserAttending(false);
        }

        if (event.getFormQuestions() != null) {
            dto.setFormQuestions(event.getFormQuestions().stream().map(q -> {
                EventFormQuestionResponse qDto = new EventFormQuestionResponse();
                qDto.setId(q.getId());
                qDto.setQuestionText(q.getQuestionText());
                qDto.setQuestionType(q.getQuestionType());
                return qDto;
            }).collect(Collectors.toList()));
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

    // HELPER METHODS
    private ClubMember findMembership(String firebaseUid, Long clubId, Role... allowedRoles) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found."));

        ClubMember membership = clubMemberRepository.findByClubIdAndUserId(clubId, user.getId())
                .orElseThrow(() -> new RuntimeException("User is not a member of this club."));

        if (allowedRoles == null || allowedRoles.length == 0) {
            return membership;
        }

        for (Role allowedRole : allowedRoles) {
            if (membership.getRole() == allowedRole) {
                return membership;
            }
        }

        throw new SecurityException("User does not have the required role for this action.");
    }
    private EventAttendeeResponse mapAttendeeToResponse(EventAttendee attendee) {
        EventAttendeeResponse response = new EventAttendeeResponse();
        response.setUser(mapUserToSummaryDto(attendee.getUser()));
        response.setJoinedAt(attendee.getJoinedAt());

        if (attendee.getAnswers() != null) {
            response.setFormAnswers(attendee.getAnswers().stream().map(answer -> {
                AnswerResponse answerDto = new AnswerResponse();
                answerDto.setQuestionText(answer.getQuestion().getQuestionText());
                answerDto.setAnswerText(answer.getAnswerText());
                return answerDto;
            }).collect(Collectors.toList()));
        }
        return response;
    }



}