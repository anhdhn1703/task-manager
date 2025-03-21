import api from './api';

const notificationService = {
  /**
   * Lấy tất cả thông báo
   */
  getAllNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  /**
   * Lấy chi tiết thông báo theo ID
   * @param {number} id - ID của thông báo
   */
  getNotificationById: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Lấy thông báo chưa đọc
   */
  getUnreadNotifications: async () => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  /**
   * Lấy thông báo theo công việc
   * @param {number} taskId - ID của công việc
   */
  getNotificationsByTaskId: async (taskId) => {
    const response = await api.get(`/notifications/task/${taskId}`);
    return response.data;
  },

  /**
   * Lấy thông báo gần đây
   * @param {number} days - Số ngày gần đây
   */
  getRecentNotifications: async (days) => {
    const response = await api.get(`/notifications/recent/${days}`);
    return response.data;
  },

  /**
   * Tạo thông báo mới
   * @param {Object} notification - Dữ liệu thông báo
   */
  createNotification: async (notification) => {
    const response = await api.post('/notifications', notification);
    return response.data;
  },

  /**
   * Đánh dấu thông báo đã đọc
   * @param {number} id - ID của thông báo
   */
  markNotificationAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Xóa thông báo
   * @param {number} id - ID của thông báo
   */
  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
    return true;
  },

  /**
   * Kiểm tra và tạo thông báo deadline
   */
  checkAndCreateDeadlineNotifications: async () => {
    const response = await api.post('/notifications/check-deadlines');
    return response.data;
  }
};

export default notificationService; 