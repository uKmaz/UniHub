package com.unihub.api.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "club_members")
public class ClubMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "club_id")
    private Club club;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    private MembershipStatus status;

    private String Name;
}