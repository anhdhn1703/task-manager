package com.net.ken.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TagDTO {
    private Long id;
    private String name;
    private String color;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateTagDTO {
        private String name;
        private String color;
    }
} 