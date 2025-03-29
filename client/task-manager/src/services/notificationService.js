import api from './api';

const notificationService = {
  /**
   * Lấy tất cả thông báo của người dùng hiện tại
   * @returns {Promise<Array>} Danh sách thông báo
   */
  getAllNotifications: async () => {
    try {
      console.log('NotificationService: Đang lấy tất cả thông báo');
      const response = await api.get('/notifications');
      
      if (!response || !response.data) {
        console.error('NotificationService: Không có dữ liệu từ API /notifications');
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('NotificationService: Lỗi khi lấy tất cả thông báo', error);
      return [];
    }
  },
  
  /**
   * Lấy chi tiết thông báo theo ID
   * @param {number} id ID của thông báo
   * @returns {Promise<Object>} Thông tin chi tiết thông báo
   */
  getNotificationById: async (id) => {
    try {
      console.log(`NotificationService: Đang lấy thông báo với ID ${id}`);
      const response = await api.get(`/notifications/${id}`);
      
      if (!response || !response.data) {
        console.error(`NotificationService: Không có dữ liệu từ API /notifications/${id}`);
        return null;
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`NotificationService: Lỗi khi lấy thông báo ID ${id}`, error);
      return null;
    }
  },
  
  /**
   * Lấy các thông báo chưa đọc
   * @returns {Promise<Array>} Danh sách thông báo chưa đọc
   */
  getUnreadNotifications: async () => {
    try {
      console.log('NotificationService: Đang lấy thông báo chưa đọc');
      const response = await api.get('/notifications/unread');
      
      if (!response || !response.data) {
        console.error('NotificationService: Không có dữ liệu từ API /notifications/unread');
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error('NotificationService: Lỗi khi lấy thông báo chưa đọc', error);
      return [];
    }
  },
  
  /**
   * Lấy thông báo theo công việc
   * @param {number} taskId ID của công việc
   * @returns {Promise<Array>} Danh sách thông báo
   */
  getNotificationsByTaskId: async (taskId) => {
    try {
      console.log(`NotificationService: Đang lấy thông báo cho task ID ${taskId}`);
      const response = await api.get(`/notifications/task/${taskId}`);
      
      if (!response || !response.data) {
        console.error(`NotificationService: Không có dữ liệu từ API /notifications/task/${taskId}`);
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error(`NotificationService: Lỗi khi lấy thông báo cho task ID ${taskId}`, error);
      return [];
    }
  },
  
  /**
   * Lấy thông báo gần đây trong số ngày
   * @param {number} days Số ngày gần đây
   * @returns {Promise<Array>} Danh sách thông báo
   */
  getRecentNotifications: async (days = 7) => {
    try {
      console.log(`NotificationService: Đang lấy thông báo trong ${days} ngày gần đây`);
      const response = await api.get(`/notifications/recent/${days}`);
      
      if (!response || !response.data) {
        console.error(`NotificationService: Không có dữ liệu từ API /notifications/recent/${days}`);
        return [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error(`NotificationService: Lỗi khi lấy thông báo gần đây`, error);
      return [];
    }
  },
  
  /**
   * Tạo thông báo mới
   * @param {string} message Nội dung thông báo
   * @param {string} type Loại thông báo
   * @param {number} taskId ID của công việc liên quan
   * @returns {Promise<Object>} Thông báo đã tạo
   */
  createNotification: async (message, type, taskId) => {
    try {
      console.log(`NotificationService: Đang tạo thông báo mới cho task ID ${taskId}`);
      const response = await api.post('/notifications', {
        message,
        type,
        taskId
      });
      
      if (!response || !response.data) {
        console.error('NotificationService: Không có dữ liệu từ API POST /notifications');
        throw new Error('Không nhận được phản hồi từ server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('NotificationService: Lỗi khi tạo thông báo mới', error);
      throw error;
    }
  },
  
  /**
   * Đánh dấu thông báo đã đọc
   * @param {number} id ID của thông báo
   * @returns {Promise<Object>} Thông báo đã cập nhật
   */
  markNotificationAsRead: async (id) => {
    try {
      console.log(`NotificationService: Đang đánh dấu đã đọc thông báo ID ${id}`);
      const response = await api.patch(`/notifications/${id}/read`);
      
      if (!response || !response.data) {
        console.error(`NotificationService: Không có dữ liệu từ API PATCH /notifications/${id}/read`);
        throw new Error('Không nhận được phản hồi từ server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`NotificationService: Lỗi khi đánh dấu đã đọc thông báo ID ${id}`, error);
      throw error;
    }
  },
  
  /**
   * Xóa thông báo
   * @param {number} id ID của thông báo
   * @returns {Promise<boolean>} Kết quả xóa
   */
  deleteNotification: async (id) => {
    try {
      console.log(`NotificationService: Đang xóa thông báo ID ${id}`);
      const response = await api.delete(`/notifications/${id}`);
      
      if (response && response.data && response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error(`NotificationService: Lỗi khi xóa thông báo ID ${id}`, error);
      throw error;
    }
  },
  
  /**
   * Đánh dấu tất cả thông báo đã đọc
   * @returns {Promise<number>} Số thông báo đã cập nhật
   */
  markAllAsRead: async () => {
    try {
      console.log('NotificationService: Đang đánh dấu tất cả thông báo đã đọc');
      const response = await api.patch('/notifications/read-all');
      
      if (!response || !response.data) {
        console.error('NotificationService: Không có dữ liệu từ API PATCH /notifications/read-all');
        return 0;
      }
      
      return response.data.data || 0;
    } catch (error) {
      console.error('NotificationService: Lỗi khi đánh dấu tất cả thông báo đã đọc', error);
      return 0;
    }
  },
  
  /**
   * Yêu cầu hệ thống kiểm tra và tạo thông báo cho công việc đến hạn
   * @returns {Promise<boolean>} Kết quả thành công hay không
   */
  checkAndCreateDeadlineNotifications: async () => {
    try {
      console.log('NotificationService: Đang yêu cầu kiểm tra deadline');
      await api.post('/notifications/check-deadlines');
      return true;
    } catch (error) {
      console.error('NotificationService: Lỗi khi yêu cầu kiểm tra deadline', error);
      return false;
    }
  },
  
  /**
   * Yêu cầu hệ thống kiểm tra và tạo thông báo hàng giờ cho công việc đến hạn
   * @returns {Promise<boolean>} Kết quả thành công hay không
   */
  checkHourlyDeadlineNotifications: async () => {
    try {
      console.log('NotificationService: Đang yêu cầu kiểm tra deadline hàng giờ');
      await api.post('/notifications/check-hourly-deadlines');
      return true;
    } catch (error) {
      console.error('NotificationService: Lỗi khi yêu cầu kiểm tra deadline hàng giờ', error);
      return false;
    }
  },
  
  /**
   * Xóa các thông báo hết hạn
   * @returns {Promise<number>} Số thông báo đã xóa
   */
  deleteExpiredNotifications: async () => {
    try {
      console.log('NotificationService: Đang yêu cầu xóa thông báo hết hạn');
      const response = await api.delete('/notifications/expired');
      
      if (!response || !response.data) {
        console.error('NotificationService: Không có dữ liệu từ API DELETE /notifications/expired');
        return 0;
      }
      
      return response.data.data || 0;
    } catch (error) {
      console.error('NotificationService: Lỗi khi xóa thông báo hết hạn', error);
      return 0;
    }
  },
  
  /**
   * Lấy số lượng thông báo chưa đọc
   * @returns {Promise<number>} Số lượng thông báo chưa đọc
   */
  getUnreadCount: async () => {
    try {
      console.log('NotificationService: Đang lấy số lượng thông báo chưa đọc');
      const response = await api.get('/notifications/unread');
      
      if (!response || !response.data) {
        console.error('NotificationService: Không có dữ liệu từ API /notifications/unread');
        return 0;
      }
      
      return response.data.data?.length || 0;
    } catch (error) {
      console.error('NotificationService: Lỗi khi lấy số lượng thông báo chưa đọc', error);
      return 0;
    }
  },
  
  /**
   * Lấy màu dựa vào mức độ ưu tiên của thông báo
   * @param {string} priority - Mức độ ưu tiên
   * @returns {string} Mã màu
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
   * @returns {string} Tên icon
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
   * @returns {string} Chuỗi thời gian đã định dạng
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