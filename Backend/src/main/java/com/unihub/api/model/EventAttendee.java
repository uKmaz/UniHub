package com.unihub.api.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "event_attendees")
public class EventAttendee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;
}