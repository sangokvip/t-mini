import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mediaRoutes from './routes/media';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 测试路由
app.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

// API 路由
app.use('/api/media', mediaRoutes);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 