import api from './api';

const tagService = {
  /**
   * Lấy tất cả tag
   * @returns {Promise<Array>} Danh sách tag
   */
  getAllTags: async () => {
    try {
      console.log('TagService: Đang lấy tất cả tag');
      const response = await api.get('/tags');
      
      if (!response || !response.data) {
        console.error('TagService: Không có dữ liệu từ API /tags');
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('TagService: Lỗi khi lấy tất cả tag', error);
      return [];
    }
  },
  
  /**
   * Lấy tag theo ID
   * @param {number} id ID của tag
   * @returns {Promise<Object>} Thông tin chi tiết tag
   */
  getTagById: async (id) => {
    try {
      console.log(`TagService: Đang lấy tag với ID ${id}`);
      const response = await api.get(`/tags/${id}`);
      
      if (!response || !response.data) {
        console.error(`TagService: Không có dữ liệu từ API /tags/${id}`);
        return null;
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`TagService: Lỗi khi lấy tag ID ${id}`, error);
      throw error;
    }
  },
  
  /**
   * Tạo tag mới
   * @param {Object} tagData Dữ liệu tag
   * @returns {Promise<Object>} Tag đã tạo
   */
  createTag: async (tagData) => {
    try {
      console.log('TagService: Đang tạo tag mới', tagData);
      const response = await api.post('/tags', tagData);
      
      if (!response || !response.data) {
        console.error('TagService: Không có dữ liệu từ API POST /tags');
        throw new Error('Không nhận được phản hồi từ server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('TagService: Lỗi khi tạo tag mới', error);
      throw error;
    }
  },
  
  /**
   * Cập nhật tag
   * @param {number} id ID của tag
   * @param {Object} tagData Dữ liệu cập nhật
   * @returns {Promise<Object>} Tag đã cập nhật
   */
  updateTag: async (id, tagData) => {
    try {
      console.log(`TagService: Đang cập nhật tag ID ${id}`, tagData);
      const response = await api.put(`/tags/${id}`, tagData);
      
      if (!response || !response.data) {
        console.error(`TagService: Không có dữ liệu từ API PUT /tags/${id}`);
        throw new Error('Không nhận được phản hồi từ server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`TagService: Lỗi khi cập nhật tag ID ${id}`, error);
      throw error;
    }
  },
  
  /**
   * Xóa tag
   * @param {number} id ID của tag
   * @returns {Promise<boolean>} Kết quả xóa
   */
  deleteTag: async (id) => {
    try {
      console.log(`TagService: Đang xóa tag ID ${id}`);
      await api.delete(`/tags/${id}`);
      return true;
    } catch (error) {
      console.error(`TagService: Lỗi khi xóa tag ID ${id}`, error);
      throw error;
    }
  }
};

export default tagService; 