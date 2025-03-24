import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import authService from '../services/authService';
import { jwtDecode } from 'jwt-decode';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      
      // Actions
      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          console.log('AuthStore: Đang đăng nhập với username:', username);
          const result = await authService.login(username, password);
          
          if (!result || !result.token || !result.user) {
            throw new Error('Phản hồi đăng nhập không hợp lệ');
          }
          
          console.log('AuthStore: Đăng nhập thành công, token nhận được');
          set({ 
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken || null,
            isLoading: false,
            error: null
          });
          return result;
        } catch (error) {
          console.error('AuthStore - Lỗi đăng nhập:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Lỗi đăng nhập, vui lòng thử lại' 
          });
          throw error;
        }
      },
      
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.register(
            userData.username, 
            userData.email, 
            userData.password
          );
          
          if (result.success && result.token) {
            set({ 
              user: result.user || { 
                username: userData.username, 
                email: userData.email 
              },
              token: result.token,
              refreshToken: result.refreshToken || null,
              isLoading: false,
              error: null
            });
          }
          
          return result;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Lỗi đăng ký, vui lòng thử lại' 
          });
          throw error;
        }
      },
      
      logout: () => {
        // Gọi service logout nếu cần
        authService.logout();
        
        // Reset state
        set({ 
          user: null,
          token: null,
          refreshToken: null,
          isLoading: false,
          error: null
        });
      },
      
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await authService.changePassword(currentPassword, newPassword);
          set({ isLoading: false });
          return true;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.message || 'Lỗi đổi mật khẩu, vui lòng thử lại' 
          });
          throw error;
        }
      },
      
      // Helpers
      isTokenValid: () => {
        const { token } = get();
        if (!token) return false;
        
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          return decoded.exp > currentTime;
        } catch (error) {
          console.error('Lỗi kiểm tra token:', error);
          return false;
        }
      },
      
      isAuthenticated: () => {
        return !!get().token && get().isTokenValid();
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage', // tên key trong localStorage
      partialize: (state) => ({ // chỉ lưu trữ các trường này
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore; 