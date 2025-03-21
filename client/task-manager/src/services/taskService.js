import api from './api';

const taskService = {
  /**
   * Lấy tất cả công việc
   */
  getAllTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },

  /**
   * Lấy chi tiết công việc theo ID
   * @param {number} id - ID của công việc
   */
  getTaskById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  /**
   * Lấy công việc theo dự án
   * @param {number} projectId - ID của dự án
   */
  getTasksByProjectId: async (projectId) => {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
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
   * @param {Object} task - Dữ liệu công việc
   */
  createTask: async (task) => {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  /**
   * Cập nhật công việc
   * @param {number} id - ID của công việc
   * @param {Object} task - Dữ liệu công việc cập nhật
   */
  updateTask: async (id, task) => {
    const response = await api.put(`/tasks/${id}`, task);
    return response.data;
  },

  /**
   * Cập nhật trạng thái công việc
   * @param {number} id - ID của công việc
   * @param {string} status - Trạng thái mới
   */
  updateTaskStatus: async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
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
   */
  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    return true;
  }
};

export default taskService; 