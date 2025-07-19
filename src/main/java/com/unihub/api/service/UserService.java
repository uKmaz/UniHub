package com.unihub.api.service;

import com.unihub.api.model.User;
import com.unihub.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(User user) {
        // İleride burada e-posta veya studentID'nin zaten kayıtlı olup olmadığını
        // kontrol eden bir mantık ekleyebiliriz.
        return userRepository.save(user);
    }
}