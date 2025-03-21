package com.net.ken.server.service.impl;

import com.net.ken.server.dto.TagDTO;
import com.net.ken.server.dto.TagDTO.CreateTagDTO;
import com.net.ken.server.model.Tag;
import com.net.ken.server.repository.TagRepository;
import com.net.ken.server.service.TagService;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;

    @Autowired
    public TagServiceImpl(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Override
    public List<TagDTO> getAllTags() {
        return tagRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TagDTO getTagById(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + id));
        return convertToDTO(tag);
    }

    @Override
    @Transactional
    public TagDTO createTag(CreateTagDTO createTagDTO) {
        // Kiểm tra xem tên thẻ đã tồn tại chưa
        if (tagRepository.existsByName(createTagDTO.getName())) {
            throw new EntityExistsException("Thẻ với tên này đã tồn tại: " + createTagDTO.getName());
        }
        
        Tag tag = new Tag();
        tag.setName(createTagDTO.getName());
        tag.setColor(createTagDTO.getColor());
        
        Tag savedTag = tagRepository.save(tag);
        return convertToDTO(savedTag);
    }

    @Override
    @Transactional
    public TagDTO updateTag(Long id, CreateTagDTO updateTagDTO) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + id));
        
        // Kiểm tra xem tên mới đã tồn tại chưa nếu tên đang thay đổi
        if (!tag.getName().equals(updateTagDTO.getName()) && 
                tagRepository.existsByName(updateTagDTO.getName())) {
            throw new EntityExistsException("Thẻ với tên này đã tồn tại: " + updateTagDTO.getName());
        }
        
        tag.setName(updateTagDTO.getName());
        tag.setColor(updateTagDTO.getColor());
        
        Tag updatedTag = tagRepository.save(tag);
        return convertToDTO(updatedTag);
    }

    @Override
    @Transactional
    public void deleteTag(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy thẻ với ID: " + id);
        }
        tagRepository.deleteById(id);
    }
    
    private TagDTO convertToDTO(Tag tag) {
        return new TagDTO(tag.getId(), tag.getName(), tag.getColor());
    }
} 