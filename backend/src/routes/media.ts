import express from 'express';
import multer from 'multer';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../lib/s3';
import { supabase } from '../lib/supabase';
import { Media } from '../types/supabase';

const router = express.Router();

// 配置临时文件存储
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 中间件：验证管理员身份
const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.headers['user-id'];
  if (userId === process.env.ADMIN_USER_ID) {
    next();
  } else {
    res.status(403).json({ error: '没有权限' });
  }
};

// 获取所有媒体文件
router.get('/', async (req, res) => {
  try {
    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: '获取媒体文件失败' });
  }
});

// 上传媒体文件
router.post('/upload', isAdmin, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const timestamp = Date.now();
        const filename = `${timestamp}-${Math.round(Math.random() * 1E9)}${file.originalname}`;
        const isVideo = file.mimetype.startsWith('video/');

        // 上传到 S3
        const putCommand = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype
        });
        await s3Client.send(putCommand);

        // 使用公开 URL
        const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;

        // 保存到 Supabase
        const { data: media, error } = await supabase
          .from('media')
          .insert({
            filename,
            originalname: file.originalname,
            type: isVideo ? 'video' : 'image',
            url,
            uploaded_by: req.headers['user-id'] as string,
          })
          .select()
          .single();

        if (error) throw error;
        return media;
      })
    );

    res.json(uploadedFiles);
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// 删除媒体文件
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    // 从 Supabase 获取文件信息
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !media) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 从 S3 删除文件
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: media.filename,
    });
    await s3Client.send(deleteCommand);

    // 从 Supabase 删除记录
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router; 