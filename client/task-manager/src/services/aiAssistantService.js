import api from './api';

const aiAssistantService = {
  /**
   * Lấy thứ tự công việc được tối ưu bởi AI
   */
  getOptimizedTaskOrder: async () => {
    const response = await api.get('/ai-assistant/optimize-tasks');
    return response.data;
  }
};

export default aiAssistantService; 