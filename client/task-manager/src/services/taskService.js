import api from './api';

// Helper để lấy ID người dùng hiện tại từ localStorage
const getCurrentUserId = () => {
  try {
    const userInfo = localStorage.getItem('user_info');
    
    // Kiểm tra kỹ hơn để tránh lỗi khi parse JSON
    if (!userInfo || userInfo === 'undefined' || userInfo === 'null') {
      console.log('TaskService: Không tìm thấy thông tin người dùng trong localStorage');
      return null;
    }
    
    const user = JSON.parse(userInfo);
    if (!user || !user.id) {
      console.log('TaskService: ID người dùng không tồn tại trong dữ liệu user_info');
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Lỗi khi lấy ID người dùng:', error);
    return null;
  }
};

const taskService = {
  /**
   * Lấy danh sách công việc
   * @param {Object} params - Các tham số lọc và phân trang 
   * @returns {Promise<Object>}
   */
  getTasks: async (params = {}) => {
    try {
      console.log('TaskService: Đang lấy danh sách công việc với params:', params);
      // Không cần thêm userId nữa vì server sẽ lấy từ JWT token
      const response = await api.get('/tasks', { params });
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error('TaskService: Không có dữ liệu trả về từ API /tasks');
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('TaskService: Lỗi khi lấy danh sách công việc:', error);
      return [];
    }
  },

  /**
   * Lấy tất cả công việc của người dùng hiện tại
   * @returns {Promise<Array>} - Danh sách công việc
   */
  getAllTasks: async () => {
    try {
      console.log('TaskService: Đang lấy tất cả công việc của người dùng hiện tại');
      const response = await api.get('/tasks');
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error('TaskService: Không có dữ liệu trả về từ API /tasks');
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('TaskService: Lỗi khi lấy tất cả công việc:', error);
      return [];
    }
  },

  /**
   * Lấy chi tiết công việc theo ID
   * @param {number} id - ID của công việc
   * @returns {Promise<Object>}
   */
  getTaskById: async (id) => {
    try {
      // Không cần thêm userId nữa vì server sẽ lấy từ JWT token
      const response = await api.get(`/tasks/${id}`);
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error(`TaskService: Không có dữ liệu trả về từ API /tasks/${id}`);
        return null;
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`TaskService: Lỗi khi lấy chi tiết công việc ${id}:`, error);
      throw error;
    }
  },

  /**
   * Lấy công việc theo dự án
   * @param {number} projectId - ID của dự án
   */
  getTasksByProjectId: async (projectId) => {
    try {
      const response = await api.get(`/tasks/project/${projectId}`);
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error(`TaskService: Không có dữ liệu trả về từ API /tasks/project/${projectId}`);
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error(`TaskService: Lỗi khi lấy công việc theo dự án ${projectId}:`, error);
      return [];
    }
  },

  /**
   * Lấy công việc theo trạng thái
   * @param {string} status - Trạng thái công việc
   */
  getTasksByStatus: async (status) => {
    const response = await api.get(`/tasks/status/${status}`);
    return response.data;
  },

  /**
   * Lấy công việc theo mức độ ưu tiên
   * @param {string} priority - Mức độ ưu tiên
   */
  getTasksByPriority: async (priority) => {
    const response = await api.get(`/tasks/priority/${priority}`);
    return response.data;
  },

  /**
   * Lấy công việc sắp đến hạn trong số ngày
   * @param {number} days - Số ngày
   */
  getTasksDueWithinDays: async (days) => {
    const response = await api.get(`/tasks/due-within/${days}`);
    return response.data;
  },

  /**
   * Tạo công việc mới
   * @param {Object} taskData - Dữ liệu công việc
   * @returns {Promise<Object>}
   */
  createTask: async (taskData) => {
    // Thêm userId vào dữ liệu nếu chưa có
    const userId = getCurrentUserId();
    if (userId && !taskData.userId) {
      taskData.userId = userId;
    }
    
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  /**
   * Cập nhật thông tin công việc
   * @param {number} id - ID của công việc
   * @param {Object} taskData - Dữ liệu cập nhật
   * @returns {Promise<Object>}
   */
  updateTask: async (id, taskData) => {
    // Thêm userId vào dữ liệu để xác thực
    const userId = getCurrentUserId();
    if (userId) {
      taskData.userId = userId;
    }
    
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  /**
   * Cập nhật trạng thái của công việc
   * @param {number} id - ID của công việc
   * @param {string} status - Trạng thái mới
   * @returns {Promise<Object>}
   */
  updateTaskStatus: async (id, status) => {
    const userId = getCurrentUserId();
    const response = await api.patch(`/tasks/${id}/status`, { 
      status,
      userId // Thêm userId vào body
    });
    return response.data;
  },

  /**
   * Cập nhật tiến độ công việc
   * @param {number} id - ID của công việc
   * @param {number} progress - Tiến độ mới (0-100)
   */
  updateTaskProgress: async (id, progress) => {
    const response = await api.patch(`/tasks/${id}/progress`, { progress });
    return response.data;
  },

  /**
   * Xóa công việc
   * @param {number} id - ID của công việc
   * @returns {Promise<Object>}
   */
  deleteTask: async (id) => {
    // Không cần thêm userId nữa vì server sẽ lấy từ JWT token
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  /**
   * Lấy danh sách công việc theo dự án
   * @param {number} projectId - ID của dự án
   * @param {Object} params - Các tham số lọc và phân trang
   * @returns {Promise<Object>}
   */
  getTasksByProject: async (projectId, params = {}) => {
    // Không cần thêm userId nữa vì server sẽ lấy từ JWT token
    const response = await api.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
  }
};

export default taskService; 