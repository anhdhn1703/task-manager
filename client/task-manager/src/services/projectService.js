import api from './api';

// Helper để lấy ID người dùng hiện tại từ localStorage
const getCurrentUserId = () => {
  try {
    const userInfo = localStorage.getItem('user_info');
    
    // Kiểm tra xem userInfo có tồn tại không
    if (!userInfo || userInfo === 'undefined' || userInfo === 'null') {
      console.log('projectService: Không tìm thấy thông tin người dùng trong localStorage');
      return null;
    }
    
    const user = JSON.parse(userInfo);
    
    if (!user || !user.id) {
      console.log('projectService: Thông tin người dùng không có ID:', user);
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('projectService: Lỗi khi lấy ID người dùng:', error);
    return null;
  }
};

const projectService = {
  /**
   * Lấy danh sách tất cả dự án
   * @returns {Promise<Array>} Danh sách tất cả dự án của người dùng hiện tại
   */
  getAllProjects: async () => {
    try {
      console.log('projectService: Đang lấy tất cả dự án của người dùng hiện tại');
      const response = await api.get('/projects');
      return response.data;
    } catch (error) {
      console.error('projectService - Lỗi khi lấy tất cả dự án:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách tất cả dự án của người dùng
   * @returns {Promise<Array>} Danh sách dự án
   */
  getProjects: async () => {
    try {
      // Không cần kiểm tra userId nữa vì server đã xác thực qua token JWT
      // const userId = getCurrentUserId();
      // if (!userId) {
      //   console.warn('projectService: Không thể lấy danh sách dự án vì không có ID người dùng');
      //   throw new Error('Vui lòng đăng nhập để xem danh sách dự án');
      // }
      
      console.log('projectService: Đang lấy danh sách dự án cho người dùng hiện tại');
      const response = await api.get('/projects');
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error('projectService: Không có dữ liệu trả về từ API /projects');
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('projectService - Lỗi khi lấy danh sách dự án:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết một dự án
   * @param {number} projectId - ID của dự án
   * @returns {Promise<Object>} Thông tin chi tiết của dự án
   */
  getProjectById: async (projectId) => {
    try {
      console.log(`projectService: Đang lấy thông tin dự án ID: ${projectId}`);
      const response = await api.get(`/projects/${projectId}`);
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error(`projectService: Không có dữ liệu trả về từ API /projects/${projectId}`);
        return null;
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`projectService - Lỗi khi lấy thông tin dự án ID ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Tạo dự án mới
   * @param {Object} projectData - Thông tin dự án mới
   * @returns {Promise<Object>} Dự án đã được tạo
   */
  createProject: async (projectData) => {
    try {
      // Không cần thêm userId nữa vì server sẽ lấy từ JWT token
      console.log('projectService: Đang tạo dự án mới với dữ liệu:', projectData);
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('projectService - Lỗi khi tạo dự án mới:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin dự án
   * @param {number} projectId - ID của dự án
   * @param {Object} projectData - Thông tin cập nhật
   * @returns {Promise<Object>} Dự án đã được cập nhật
   */
  updateProject: async (projectId, projectData) => {
    try {
      console.log(`projectService: Đang cập nhật dự án ID: ${projectId} với dữ liệu:`, projectData);
      const response = await api.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error(`projectService - Lỗi khi cập nhật dự án ID ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Xóa dự án
   * @param {number} projectId - ID của dự án cần xóa
   * @returns {Promise<Object>} Kết quả xóa
   */
  deleteProject: async (projectId) => {
    try {
      console.log(`projectService: Đang xóa dự án ID: ${projectId}`);
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`projectService - Lỗi khi xóa dự án ID ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy danh sách dự án theo trạng thái
   * @param {string} status - Trạng thái dự án
   * @returns {Promise<Array>} Danh sách dự án
   */
  getProjectsByStatus: async (status) => {
    try {
      // Không cần kiểm tra userId nữa vì server đã xác thực qua JWT token
      console.log(`projectService: Đang lấy danh sách dự án với trạng thái: ${status}`);
      const response = await api.get(`/projects/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`projectService - Lỗi khi lấy danh sách dự án theo trạng thái ${status}:`, error);
      throw error;
    }
  }
};

export default projectService; 