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

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new ApiError(error.error || '请求失败', response.status);
  }
  return response.json();
}

export const api = {
  async getMediaItems(): Promise<MediaItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/media`);
      return handleResponse<MediaItem[]>(response);
    } catch (error) {
      console.error('Error fetching media items:', error);
      throw new ApiError('获取媒体列表失败');
    }
  },

  async uploadFiles(files: FileList | File[], userId: string): Promise<MediaItem[]> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        headers: {
          'user-id': userId,
        },
        body: formData,
      });

      return handleResponse<MediaItem[]>(response);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw new ApiError('文件上传失败');
    }
  },

  async deleteMediaItem(itemId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/media/${itemId}`, {
        method: 'DELETE',
      });

      await handleResponse<{ success: boolean }>(response);
    } catch (error) {
      console.error('Error deleting media item:', error);
      throw new ApiError('删除文件失败');
    }
  },
}; 