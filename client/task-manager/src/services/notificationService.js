import api from './api';

// Helper để lấy ID người dùng hiện tại từ localStorage
const getCurrentUserId = () => {
  try {
    const userInfo = localStorage.getItem('user_info');
    
    // Kiểm tra xem userInfo có tồn tại không
    if (!userInfo || userInfo === 'undefined' || userInfo === 'null') {
      console.log('notificationService: Không tìm thấy thông tin người dùng trong localStorage');
      return null;
    }
    
    const user = JSON.parse(userInfo);
    
    if (!user || !user.id) {
      console.log('notificationService: Thông tin người dùng không có ID:', user);
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('notificationService: Lỗi khi lấy ID người dùng:', error);
    return null;
  }
};

const notificationService = {
  /**
   * Lấy tất cả thông báo của người dùng
   * @returns {Promise<Array>} Danh sách thông báo
   */
  getNotifications: async () => {
    try {
      // Không cần kiểm tra userId nữa vì server đã xác thực qua token JWT
      // const userId = getCurrentUserId();
      // if (!userId) {
      //   console.warn('notificationService: Không thể lấy thông báo vì không có ID người dùng');
      //   throw new Error('Vui lòng đăng nhập để xem thông báo');
      // }
      
      console.log('notificationService: Đang lấy thông báo cho người dùng hiện tại');
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('notificationService - Lỗi khi lấy thông báo:', error);
      throw error;
    }
  },

  /**
   * Đánh dấu thông báo là đã đọc
   * @param {number} notificationId - ID của thông báo
   * @returns {Promise<Object>} Thông báo đã cập nhật
   */
  markAsRead: async (notificationId) => {
    try {
      console.log(`notificationService: Đang đánh dấu thông báo ID: ${notificationId} là đã đọc`);
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error(`notificationService - Lỗi khi đánh dấu thông báo ID ${notificationId} là đã đọc:`, error);
      throw error;
    }
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  markAllAsRead: async () => {
    try {
      // Sử dụng endpoint /read-all theo controller
      console.log('notificationService: Đang đánh dấu tất cả thông báo là đã đọc');
      const response = await api.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('notificationService - Lỗi khi đánh dấu tất cả thông báo là đã đọc:', error);
      throw error;
    }
  },

  /**
   * Xóa một thông báo
   * @param {number} notificationId - ID của thông báo
   * @returns {Promise<Object>} Kết quả xóa
   */
  deleteNotification: async (notificationId) => {
    try {
      console.log(`notificationService: Đang xóa thông báo ID: ${notificationId}`);
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error(`notificationService - Lỗi khi xóa thông báo ID ${notificationId}:`, error);
      throw error;
    }
  },

  /**
   * Xóa tất cả thông báo
   * @returns {Promise<Object>} Kết quả xóa
   */
  deleteAllNotifications: async () => {
    try {
      // Không cần kiểm tra userId nữa vì server sẽ lấy từ JWT token
      console.log('notificationService: Đang xóa tất cả thông báo');
      const response = await api.delete('/notifications');
      return response.data;
    } catch (error) {
      console.error('notificationService - Lỗi khi xóa tất cả thông báo:', error);
      throw error;
    }
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   * @returns {Promise<number>}
   */
  getUnreadCount: async () => {
    try {
      // Sử dụng endpoint /unread có sẵn và đếm số phần tử
      console.log('notificationService: Đang lấy số lượng thông báo chưa đọc');
      const response = await api.get('/notifications/unread');
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data || !response.data.data) {
        console.error('notificationService: Không có dữ liệu trả về từ API /notifications/unread');
        return 0;
      }
      
      return response.data.data.length || 0; // Trả về số lượng thông báo
    } catch (error) {
      console.error('notificationService - Lỗi khi lấy số lượng thông báo chưa đọc:', error);
      return 0; // Trả về 0 nếu có lỗi
    }
  },

  /**
   * Lấy tất cả thông báo
   */
  getAllNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error('notificationService: Không có dữ liệu trả về từ API /notifications');
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('notificationService - Lỗi khi lấy tất cả thông báo:', error);
      return [];
    }
  },

  /**
   * Lấy thông báo chưa đọc
   */
  getUnreadNotifications: async () => {
    try {
      const response = await api.get('/notifications/unread');
      
      // Kiểm tra dữ liệu trả về
      if (!response || !response.data) {
        console.error('notificationService: Không có dữ liệu trả về từ API /notifications/unread');
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('notificationService - Lỗi khi lấy thông báo chưa đọc:', error);
      return [];
    }
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
   * Kiểm tra và tạo thông báo deadline
   */
  checkAndCreateDeadlineNotifications: async () => {
    const response = await api.post('/notifications/check-deadlines');
    return response.data;
  },
  
  /**
   * Lấy màu dựa vào mức độ ưu tiên của thông báo
   * @param {string} priority - Mức độ ưu tiên
   */
  getPriorityColor: (priority) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
        return '#f44336'; // Đỏ
      case 'HIGH':
        return '#ff9800'; // Cam 
      case 'NORMAL':
        return '#2196f3'; // Xanh dương
      case 'LOW':
        return '#4caf50'; // Xanh lá
      default:
        return '#757575'; // Xám
    }
  },
  
  /**
   * Lấy icon dựa vào loại thông báo
   * @param {string} type - Loại thông báo
   */
  getNotificationIcon: (type) => {
    switch (type?.toUpperCase()) {
      case 'DEADLINE_APPROACHING':
        return 'schedule'; // Icon đồng hồ
      case 'DEADLINE_OVERDUE':
        return 'warning'; // Icon cảnh báo
      case 'TASK_ASSIGNED':
        return 'assignment_ind'; // Icon gán việc
      case 'TASK_COMPLETED':
        return 'check_circle'; // Icon hoàn thành
      case 'PRIORITY_CHANGED':
        return 'low_priority'; // Icon ưu tiên
      default:
        return 'notifications'; // Icon thông báo mặc định
    }
  },
  
  /**
   * Định dạng thời gian hiển thị
   * @param {Date} date - Thời gian
   */
  formatNotificationTime: (date) => {
    if (!date) return '';
    
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return notificationDate.toLocaleDateString('vi-VN');
  }
};

export default notificationService; 