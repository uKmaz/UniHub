package com.unihub.api.controller.responses;

import com.unihub.api.model.MembershipStatus;
import com.unihub.api.model.Role;

// Sadece o anki kullanıcının üyelik detaylarını içerir
public class CurrentUserMembershipResponse {
    public Role role;
    public MembershipStatus status;
    public boolean eventNotificationsEnabled;
    public boolean postNotificationsEnabled;
}