import { useEffect, useState, type ChangeEvent } from 'react';
import { api, type MediaItem } from '../services/api';

function AdminPanel() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 获取媒体列表
    const fetchMediaItems = async () => {
      try {
        const items = await api.getMediaItems();
        setMediaItems(items);
      } catch (error) {
        console.error('Error fetching media items:', error);
        setMessage('获取媒体列表失败');
      }
    };

    fetchMediaItems();
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // 在开发环境中使用测试 ID
        const isDevelopment = import.meta.env.DEV;
        let currentUserId = '';

        if (isDevelopment) {
          currentUserId = import.meta.env.VITE_ADMIN_USER_ID || 'test_admin';
        } else {
          // 在生产环境中从 Telegram WebApp 获取用户 ID
          const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
          if (telegramUserId) {
            currentUserId = telegramUserId;
          } else {
            // 如果不是在 Telegram 中打开，提示用户输入管理员 ID
            const inputId = prompt('请输入管理员 ID：');
            if (inputId) {
              currentUserId = inputId;
            }
          }
        }

        if (currentUserId) {
          setUserId(currentUserId);
          // 检查是否是管理员
          const adminId = import.meta.env.VITE_ADMIN_USER_ID;
          setIsAdmin(currentUserId === adminId);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setMessage('验证管理员身份失败');
      }
    };

    checkAdminStatus();
  }, []);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage('');

    try {
      if (!userId) {
        throw new Error('请先登录');
      }

      if (!isAdmin) {
        throw new Error('您不是管理员');
      }

      const uploadedFiles = await api.uploadFiles(files, userId);
      setMediaItems(prev => [...uploadedFiles, ...prev]);
      setMessage('文件上传成功！');
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      if (!isAdmin) {
        throw new Error('您不是管理员');
      }

      await api.deleteMediaItem(itemId);
      setMediaItems(prev => prev.filter(item => item.id !== itemId));
      setMessage('删除成功！');
    } catch (error) {
      console.error('Error deleting item:', error);
      setMessage(error instanceof Error ? error.message : '删除失败，请重试');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>抱歉，您没有管理员权限。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="mb-6">
        <label className="block mb-2">
          <span className="text-gray-700">上传文件</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </label>
        {uploading && <p className="text-blue-600">正在上传...</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaItems.map(item => (
          <div key={item.id} className="border rounded-lg p-4">
            {item.type === 'image' ? (
              <img src={item.url} alt={item.originalname} className="w-full h-48 object-cover mb-2" />
            ) : (
              <video src={item.url} controls className="w-full h-48 object-cover mb-2" />
            )}
            <p className="text-sm text-gray-600 truncate">{item.originalname}</p>
            <button
              onClick={() => handleDelete(item.id)}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel; 