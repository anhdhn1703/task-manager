import api from './api';

const tagService = {
  /**
   * Lấy tất cả thẻ
   */
  getAllTags: async () => {
    const response = await api.get('/tags');
    return response.data;
  },

  /**
   * Lấy chi tiết thẻ theo ID
   * @param {number} id - ID của thẻ
   */
  getTagById: async (id) => {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  },

  /**
   * Tạo thẻ mới
   * @param {Object} tag - Dữ liệu thẻ
   */
  createTag: async (tag) => {
    const response = await api.post('/tags', tag);
    return response.data;
  },

  /**
   * Cập nhật thẻ
   * @param {number} id - ID của thẻ
   * @param {Object} tag - Dữ liệu thẻ cập nhật
   */
  updateTag: async (id, tag) => {
    const response = await api.put(`/tags/${id}`, tag);
    return response.data;
  },

  /**
   * Xóa thẻ
   * @param {number} id - ID của thẻ
   */
  deleteTag: async (id) => {
    await api.delete(`/tags/${id}`);
    return true;
  }
};

export default tagService; 