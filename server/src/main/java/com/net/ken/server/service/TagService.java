package com.net.ken.server.service;

import com.net.ken.server.dto.TagDTO;
import com.net.ken.server.dto.TagDTO.CreateTagDTO;

import java.util.List;

public interface TagService {
    List<TagDTO> getAllTags();
    
    TagDTO getTagById(Long id);
    
    TagDTO createTag(CreateTagDTO createTagDTO);
    
    TagDTO updateTag(Long id, CreateTagDTO updateTagDTO);
    
    void deleteTag(Long id);
} 