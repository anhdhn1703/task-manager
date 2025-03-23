package com.net.ken.server.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private List<String> roles;
    private String fullName;
    
    public JwtResponse(String token, Long id, String username, String email, List<String> roles, String fullName) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.fullName = fullName;
    }
} 