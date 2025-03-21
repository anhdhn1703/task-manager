import api from './api';

const projectService = {
  /**
   * Lấy tất cả dự án
   */
  getAllProjects: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  /**
   * Lấy chi tiết dự án theo ID
   * @param {number} id - ID của dự án
   */
  getProjectById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  /**
   * Tạo dự án mới
   * @param {Object} project - Dữ liệu dự án
   */
  createProject: async (project) => {
    const response = await api.post('/projects', project);
    return response.data;
  },

  /**
   * Cập nhật dự án
   * @param {number} id - ID của dự án
   * @param {Object} project - Dữ liệu dự án cập nhật
   */
  updateProject: async (id, project) => {
    const response = await api.put(`/projects/${id}`, project);
    return response.data;
  },

  /**
   * Xóa dự án
   * @param {number} id - ID của dự án
   */
  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    return true;
  }
};

export default projectService; 