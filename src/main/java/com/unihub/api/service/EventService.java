package com.unihub.api.service;

import com.unihub.api.model.Event;
import com.unihub.api.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;

    @Autowired
    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event createEvent(Event event) {
        // İleride burada event oluşturma ile ilgili özel kurallar olabilir.
        return eventRepository.save(event);
    }
}