package com.unihub.api.service;

import com.unihub.api.model.Post;
import com.unihub.api.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;

    @Autowired
    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    public Post createPost(Post post) {
        // İleride burada post oluşturma ile ilgili özel kurallar olabilir.
        return postRepository.save(post);
    }
}