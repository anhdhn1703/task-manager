import api from './api';

// Các phương thức truy cập API công việc
const taskService = {
  /**
   * Lấy danh sách công việc
   * @param {Object} params - Các tham số lọc và phân trang 
   * @returns {Promise<Object>}
   */
  getTasks: async (params = {}) => {
    try {
      console.log('TaskService: Đang lấy danh sách công việc với params:', params);
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
   * Lấy tất cả công việc của người dùng hiện tại với phân trang
   * @param {number} page - Số trang
   * @param {number} size - Kích thước trang
   * @param {string} sortBy - Trường sắp xếp
   * @param {string} direction - Hướng sắp xếp (asc/desc)
   * @returns {Promise<Object>} - Dữ liệu phân trang
   */
  getTasksPaged: async (page = 0, size = 10, sortBy = 'dueDate', direction = 'asc') => {
    try {
      console.log('TaskService: Đang lấy công việc phân trang');
      const response = await api.get('/tasks/paged', { 
        params: { page, size, sortBy, direction } 
      });
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error('TaskService: Không có dữ liệu trả về từ API /tasks/paged');
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          number: page
        };
      }
      
      return response.data.data || {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page
      };
    } catch (error) {
      console.error('TaskService: Lỗi khi lấy danh sách công việc phân trang:', error);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page
      };
    }
  },

  /**
   * Lấy tất cả công việc của người dùng hiện tại
   * @returns {Promise<Array>} Danh sách công việc
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
      
      // Debug response để xem cấu trúc dữ liệu
      console.log('TaskService: Cấu trúc phản hồi:', {
        fullResponse: response,
        dataField: response.data,
        nestedData: response.data.data
      });
      
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
   * Lấy công việc theo dự án với phân trang
   * @param {number} projectId - ID của dự án
   * @param {number} page - Số trang
   * @param {number} size - Kích thước trang
   * @param {string} sortBy - Trường sắp xếp
   * @param {string} direction - Hướng sắp xếp (asc/desc)
   * @returns {Promise<Object>} - Dữ liệu phân trang
   */
  getTasksByProjectIdPaged: async (projectId, page = 0, size = 10, sortBy = 'dueDate', direction = 'asc') => {
    try {
      const response = await api.get(`/tasks/project/${projectId}/paged`, {
        params: { page, size, sortBy, direction }
      });
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error(`TaskService: Không có dữ liệu trả về từ API /tasks/project/${projectId}/paged`);
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: size,
          number: page
        };
      }
      
      return response.data.data || {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page
      };
    } catch (error) {
      console.error(`TaskService: Lỗi khi lấy công việc phân trang theo dự án ${projectId}:`, error);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: size,
        number: page
      };
    }
  },

  /**
   * Lấy công việc theo trạng thái
   * @param {string} status - Trạng thái công việc
   */
  getTasksByStatus: async (status) => {
    try {
      const response = await api.get(`/tasks/status/${status}`);
      if (!response || !response.data) {
        return [];
      }
      return response.data.data || [];
    } catch (error) {
      console.error(`TaskService: Lỗi khi lấy công việc theo trạng thái ${status}:`, error);
      return [];
    }
  },

  /**
   * Lấy công việc theo mức độ ưu tiên
   * @param {string} priority - Mức độ ưu tiên
   */
  getTasksByPriority: async (priority) => {
    try {
      const response = await api.get(`/tasks/priority/${priority}`);
      if (!response || !response.data) {
        return [];
      }
      return response.data.data || [];
    } catch (error) {
      console.error(`TaskService: Lỗi khi lấy công việc theo ưu tiên ${priority}:`, error);
      return [];
    }
  },

  /**
   * Lấy công việc sắp đến hạn trong số ngày
   * @param {number} days - Số ngày
   */
  getTasksDueWithinDays: async (days) => {
    try {
      const response = await api.get(`/tasks/due-within/${days}`);
      if (!response || !response.data) {
        return [];
      }
      return response.data.data || [];
    } catch (error) {
      console.error(`TaskService: Lỗi khi lấy công việc đến hạn trong ${days} ngày:`, error);
      return [];
    }
  },

  /**
   * Tạo công việc mới
   * @param {Object} taskData - Dữ liệu công việc
   * @returns {Promise<Object>}
   */
  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      if (!response || !response.data) {
        throw new Error('Không nhận được phản hồi từ server');
      }
      return response.data.data;
    } catch (error) {
      console.error('TaskService: Lỗi khi tạo công việc mới:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin công việc
   * @param {number} id - ID của công việc
   * @param {Object} taskData - Dữ liệu cập nhật
   * @returns {Promise<Object>}
   */
  updateTask: async (id, taskData) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      if (!response || !response.data) {
        throw new Error('Không nhận được phản hồi từ server');
      }
      return response.data.data;
    } catch (error) {
      console.error(`TaskService: Lỗi khi cập nhật công việc ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái của công việc
   * @param {number} id - ID của công việc
   * @param {string} status - Trạng thái mới
   * @returns {Promise<Object>}
   */
  updateTaskStatus: async (id, status) => {
    try {
      const response = await api.patch(`/tasks/${id}/status`, { status });
      if (!response || !response.data) {
        throw new Error('Không nhận được phản hồi từ server');
      }
      return response.data.data;
    } catch (error) {
      console.error(`TaskService: Lỗi khi cập nhật trạng thái công việc ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cập nhật tiến độ công việc
   * @param {number} id - ID của công việc
   * @param {number} progress - Tiến độ mới (0-100)
   */
  updateTaskProgress: async (id, progress) => {
    try {
      const response = await api.patch(`/tasks/${id}/progress`, { progress });
      if (!response || !response.data) {
        throw new Error('Không nhận được phản hồi từ server');
      }
      return response.data.data;
    } catch (error) {
      console.error(`TaskService: Lỗi khi cập nhật tiến độ công việc ${id}:`, error);
      throw error;
    }
  },

  /**
   * Xóa công việc
   * @param {number} id - ID của công việc
   * @returns {Promise<boolean>} Kết quả xóa thành công hay không
   */
  deleteTask: async (id) => {
    try {
      console.log(`TaskService: Đang xóa công việc ${id}`);
      const response = await api.delete(`/tasks/${id}`);
      // Kiểm tra response success và trả về true nếu xóa thành công
      if (response && response.data && response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error(`TaskService: Lỗi khi xóa công việc ${id}:`, error);
      throw error;
    }
  },

  /**
   * Thêm tag vào công việc
   * @param {number} taskId - ID của công việc
   * @param {number} tagId - ID của tag
   * @returns {Promise<Object>}
   */
  addTagToTask: async (taskId, tagId) => {
    try {
      const response = await api.post(`/tasks/${taskId}/tags/${tagId}`);
      if (!response || !response.data) {
        throw new Error('Không nhận được phản hồi từ server');
      }
      return response.data.data;
    } catch (error) {
      console.error(`TaskService: Lỗi khi thêm tag ${tagId} vào công việc ${taskId}:`, error);
      throw error;
    }
  },

  /**
   * Xóa tag khỏi công việc
   * @param {number} taskId - ID của công việc
   * @param {number} tagId - ID của tag
   * @returns {Promise<Object>}
   */
  removeTagFromTask: async (taskId, tagId) => {
    try {
      const response = await api.delete(`/tasks/${taskId}/tags/${tagId}`);
      if (!response || !response.data) {
        throw new Error('Không nhận được phản hồi từ server');
      }
      return response.data.data;
    } catch (error) {
      console.error(`TaskService: Lỗi khi xóa tag ${tagId} khỏi công việc ${taskId}:`, error);
      throw error;
    }
  }
};

export default taskService; 