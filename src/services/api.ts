const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  originalname: string;
  filename: string;
  uploaded_by: string;
  created_at: string;
}

export const api = {
  async getMediaList(): Promise<MediaItem[]> {
    try {
      console.log('Fetching media list...');
      const response = await fetch(`${API_BASE_URL}/media`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || '获取媒体列表失败');
      }
      
      const data = await response.json();
      console.log('Fetched media items:', data);
      return data;
    } catch (error) {
      console.error('Error in getMediaList:', error);
      throw error;
    }
  },

  async uploadFiles(files: FileList, userId: string): Promise<MediaItem[]> {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: {
          'user-id': userId,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '上传失败');
      }
      return response.json();
    } catch (error) {
      console.error('Error in uploadFiles:', error);
      throw error;
    }
  },

  async deleteMedia(id: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/media/${id}`, {
        method: 'DELETE',
        headers: {
          'user-id': userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '删除失败');
      }
    } catch (error) {
      console.error('Error in deleteMedia:', error);
      throw error;
    }
  },
}; 