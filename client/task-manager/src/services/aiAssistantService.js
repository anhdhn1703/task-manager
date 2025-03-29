import api from './api';

const aiAssistantService = {
  /**
   * Lấy danh sách công việc được tối ưu từ AI
   * @returns {Promise<Object>} Danh sách công việc đã tối ưu và giải thích
   */
  getOptimizedTaskOrder: async () => {
    try {
      console.log('AiAssistantService: Đang lấy thứ tự công việc tối ưu');
      const response = await api.get('/ai-assistant/optimize-tasks');
      
      if (!response || !response.data) {
        console.error('AiAssistantService: Không có dữ liệu từ API /ai-assistant/optimize-tasks');
        return { optimizedTasks: [], explanation: '' };
      }
      
      return response.data.data || { optimizedTasks: [], explanation: '' };
    } catch (error) {
      console.error('AiAssistantService: Lỗi khi lấy thứ tự công việc tối ưu', error);
      return { optimizedTasks: [], explanation: 'Không thể lấy dữ liệu. Vui lòng thử lại sau.' };
    }
  }
};

export default aiAssistantService; 