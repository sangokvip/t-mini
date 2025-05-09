import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { api, MediaItem } from '../services/api';

function Gallery() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMediaItems();
  }, []);

  const fetchMediaItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await api.getMediaList();
      setMediaItems(items);
    } catch (err) {
      setError('获取媒体文件失败');
      console.error('Error fetching media items:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">媒体库</h1>
      {mediaItems.length === 0 ? (
        <div className="text-center text-gray-500">暂无媒体文件</div>
      ) : (
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
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="origin"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {item.originalname}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Gallery; 