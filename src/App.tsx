import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import Gallery from './components/Gallery';

// 声明全局 Telegram 类型
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-blue-600 hover:bg-blue-50'
      }`}
    >
      {children}
    </Link>
  );
}

function App() {
  useEffect(() => {
    // 初始化 Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-800">Telegram 媒体库</h1>
              <div className="space-x-2">
                <NavLink to="/">首页</NavLink>
                <NavLink to="/admin">管理面板</NavLink>
              </div>
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