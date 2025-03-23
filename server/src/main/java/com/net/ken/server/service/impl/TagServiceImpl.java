package com.net.ken.server.service.impl;

import com.net.ken.server.dto.TagDTO;
import com.net.ken.server.dto.TagDTO.CreateTagDTO;
import com.net.ken.server.model.Tag;
import com.net.ken.server.model.User;
import com.net.ken.server.repository.TagRepository;
import com.net.ken.server.repository.UserRepository;
import com.net.ken.server.service.TagService;
import com.net.ken.server.util.SecurityUtils;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private final UserRepository userRepository;

    @Autowired
    public TagServiceImpl(TagRepository tagRepository, UserRepository userRepository) {
        this.tagRepository = tagRepository;
        this.userRepository = userRepository;
    }
    
    // Lấy người dùng hiện tại từ context bảo mật
    private User getCurrentUser() {
        String username = SecurityUtils.getCurrentUsername()
            .orElseThrow(() -> new AccessDeniedException("Không tìm thấy thông tin người dùng hiện tại"));
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng: " + username));
    }

    @Override
    public List<TagDTO> getAllTags() {
        User currentUser = getCurrentUser();
        return tagRepository.findByUser(currentUser).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TagDTO getTagById(Long id) {
        User currentUser = getCurrentUser();
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + id));
                
        // Kiểm tra quyền truy cập
        if (tag.getUser() != null && !tag.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền truy cập thẻ này");
        }
        
        return convertToDTO(tag);
    }

    @Override
    @Transactional
    public TagDTO createTag(CreateTagDTO createTagDTO) {
        User currentUser = getCurrentUser();
        
        // Kiểm tra xem tên thẻ đã tồn tại cho người dùng này chưa
        if (tagRepository.existsByNameAndUser(createTagDTO.getName(), currentUser)) {
            throw new EntityExistsException("Thẻ với tên này đã tồn tại: " + createTagDTO.getName());
        }
        
        Tag tag = new Tag();
        tag.setName(createTagDTO.getName());
        tag.setColor(createTagDTO.getColor());
        tag.setUser(currentUser);
        
        Tag savedTag = tagRepository.save(tag);
        return convertToDTO(savedTag);
    }

    @Override
    @Transactional
    public TagDTO updateTag(Long id, CreateTagDTO updateTagDTO) {
        User currentUser = getCurrentUser();
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + id));
        
        // Kiểm tra quyền truy cập
        if (tag.getUser() != null && !tag.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền cập nhật thẻ này");
        }
        
        // Kiểm tra xem tên mới đã tồn tại chưa nếu tên đang thay đổi
        if (!tag.getName().equals(updateTagDTO.getName()) && 
                tagRepository.existsByNameAndUser(updateTagDTO.getName(), currentUser)) {
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
        User currentUser = getCurrentUser();
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + id));
                
        // Kiểm tra quyền truy cập
        if (tag.getUser() != null && !tag.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền xóa thẻ này");
        }
        
        tagRepository.deleteById(id);
    }
    
    private TagDTO convertToDTO(Tag tag) {
        return new TagDTO(tag.getId(), tag.getName(), tag.getColor());
    }
} 