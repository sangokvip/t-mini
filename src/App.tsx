import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Gallery from './components/Gallery';
import AdminPanel from './components/AdminPanel';

// 声明全局 Telegram 类型
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

function App() {
  useEffect(() => {
    // 检查是否在 Telegram Web App 环境中
    if (window.Telegram?.WebApp) {
      WebApp.ready();
      WebApp.expand();
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Telegram 媒体库</h1>
            <div className="space-x-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">首页</a>
              <a href="/admin" className="text-blue-600 hover:text-blue-800">管理面板</a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Gallery />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;