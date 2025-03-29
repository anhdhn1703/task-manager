import api from './api';

const projectService = {
  /**
   * Lấy tất cả dự án của người dùng hiện tại
   * @returns {Promise<Array>} Danh sách dự án
   */
  getAllProjects: async () => {
    try {
      console.log('ProjectService: Đang lấy tất cả dự án');
      const response = await api.get('/projects');
      
      if (!response || !response.data) {
        console.error('ProjectService: Không có dữ liệu từ API /projects');
        return [];
      }
      
      // Debug response để xem cấu trúc dữ liệu
      console.log('ProjectService: Cấu trúc phản hồi:', {
        fullResponse: response,
        dataField: response.data,
        nestedData: response.data.data
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('ProjectService: Lỗi khi lấy tất cả dự án', error);
      return [];
    }
  },

  /**
   * Lấy chi tiết dự án theo ID
   * @param {number} id ID của dự án
   * @returns {Promise<Object>} Thông tin chi tiết dự án
   */
  getProjectById: async (id) => {
    try {
      console.log(`ProjectService: Đang lấy dự án với ID ${id}`);
      const response = await api.get(`/projects/${id}`);
      
      if (!response || !response.data) {
        console.error(`ProjectService: Không có dữ liệu từ API /projects/${id}`);
        return null;
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`ProjectService: Lỗi khi lấy dự án ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Tạo dự án mới
   * @param {Object} projectData Dữ liệu dự án
   * @returns {Promise<Object>} Dự án đã tạo
   */
  createProject: async (projectData) => {
    try {
      console.log('ProjectService: Đang tạo dự án mới', projectData);
      const response = await api.post('/projects', projectData);
      
      if (!response || !response.data) {
        console.error('ProjectService: Không có dữ liệu từ API POST /projects');
        throw new Error('Không nhận được phản hồi từ server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('ProjectService: Lỗi khi tạo dự án mới', error);
      throw error;
    }
  },

  /**
   * Cập nhật dự án
   * @param {number} id ID của dự án
   * @param {Object} projectData Dữ liệu cập nhật
   * @returns {Promise<Object>} Dự án đã cập nhật
   */
  updateProject: async (id, projectData) => {
    try {
      console.log(`ProjectService: Đang cập nhật dự án ID ${id}`, projectData);
      const response = await api.put(`/projects/${id}`, projectData);
      
      if (!response || !response.data) {
        console.error(`ProjectService: Không có dữ liệu từ API PUT /projects/${id}`);
        throw new Error('Không nhận được phản hồi từ server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`ProjectService: Lỗi khi cập nhật dự án ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Xóa dự án
   * @param {number} id ID của dự án
   * @returns {Promise<boolean>} Kết quả xóa
   */
  deleteProject: async (id) => {
    try {
      console.log(`ProjectService: Đang xóa dự án ID ${id}`);
      const response = await api.delete(`/projects/${id}`);
      
      if (response && response.data && response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error(`ProjectService: Lỗi khi xóa dự án ID ${id}`, error);
      throw error;
    }
  }
};

export default projectService; 