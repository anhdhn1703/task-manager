import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../services/api';

const useProjectStore = create(
  devtools(
    (set, get) => ({
      // State
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,
      
      // Actions
      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get('/projects');
          set({ 
            projects: response.data, 
            isLoading: false 
          });
          return response.data;
        } catch (error) {
          console.error('Error fetching projects:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Lỗi khi tải dữ liệu dự án' 
          });
          throw error;
        }
      },
      
      fetchProjectById: async (id) => {
        const { projects } = get();
        const existingProject = projects.find(p => p.id === id);
        
        // Trả về từ cache nếu đã có
        if (existingProject) {
          set({ currentProject: existingProject });
          return existingProject;
        }
        
        // Nếu không có thì tải từ API
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/projects/${id}`);
          set({ 
            currentProject: response.data, 
            isLoading: false 
          });
          return response.data;
        } catch (error) {
          console.error(`Error fetching project ${id}:`, error);
          set({ 
            isLoading: false, 
            error: error.message || 'Lỗi khi tải thông tin dự án' 
          });
          throw error;
        }
      },
      
      createProject: async (projectData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/projects', projectData);
          set(state => ({ 
            projects: [...state.projects, response.data], 
            isLoading: false 
          }));
          return response.data;
        } catch (error) {
          console.error('Error creating project:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Lỗi khi tạo dự án mới' 
          });
          throw error;
        }
      },
      
      updateProject: async (id, projectData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put(`/projects/${id}`, projectData);
          set(state => ({ 
            projects: state.projects.map(p => p.id === id ? response.data : p),
            currentProject: state.currentProject?.id === id ? response.data : state.currentProject,
            isLoading: false 
          }));
          return response.data;
        } catch (error) {
          console.error(`Error updating project ${id}:`, error);
          set({ 
            isLoading: false, 
            error: error.message || 'Lỗi khi cập nhật dự án' 
          });
          throw error;
        }
      },
      
      deleteProject: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/projects/${id}`);
          set(state => ({ 
            projects: state.projects.filter(p => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
            isLoading: false 
          }));
          return true;
        } catch (error) {
          console.error(`Error deleting project ${id}:`, error);
          set({ 
            isLoading: false, 
            error: error.message || 'Lỗi khi xóa dự án' 
          });
          throw error;
        }
      },
      
      clearError: () => set({ error: null }),
      
      resetCurrentProject: () => set({ currentProject: null }),
    }),
    {
      name: 'project-store',
    }
  )
);

 