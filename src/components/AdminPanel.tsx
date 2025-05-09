import React, { useEffect, useState } from 'react';
import { api, type MediaItem } from '../services/api';

function AdminPanel() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // 在开发环境中使用测试 ID
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment) {
      setUserId(import.meta.env.VITE_ADMIN_USER_ID || 'bryansuperb');
      return;
    }

    // 在生产环境中从 Telegram WebApp 获取用户 ID
    const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
    if (telegramUserId) {
      setUserId(telegramUserId);
    } else {
      console.warn('无法获取 Telegram 用户 ID');
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage('');

    try {
      if (!userId) {
        throw new Error('请先登录');
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

  const handleDelete = async (id: string) => {
    try {
      if (!userId) {
        throw new Error('请先登录');
      }

      await api.deleteMedia(id, userId);
      setMediaItems(prev => prev.filter(item => item.id !== id));
      setMessage('文件删除成功！');
    } catch (error) {
      console.error('Error deleting file:', error);
      setMessage(error instanceof Error ? error.message : '删除失败，请重试');
    }
  };

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">提示</p>
          <p>无法获取用户信息，请确保在 Telegram 中打开此应用</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">管理员面板</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            上传媒体文件
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="w-full p-2 border rounded"
          />
        </div>

        {uploading && (
          <div className="text-center text-gray-600">上传中...</div>
        )}

        {message && (
          <div className={`mt-4 p-2 rounded ${
            message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">最近上传</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaItems.map((item) => (
              <div key={item.id} className="relative aspect-square group">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.originalname}
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="origin"
                  />
                ) : (
                  <video
                    src={item.url}
                    controls
                    className="max-w-full h-auto"
                    referrerPolicy="origin"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    删除
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
                  {item.originalname}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel; 