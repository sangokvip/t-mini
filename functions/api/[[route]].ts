import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../backend/src/lib/s3';
import { supabase } from '../../backend/src/lib/supabase';
import type { Media } from '../../backend/src/types/supabase';

export interface Env {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_BUCKET_NAME: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ADMIN_USER_ID: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  // CORS 处理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, user-id',
      },
    });
  }

  // 验证管理员身份
  const isAdmin = (userId: string | null) => {
    return userId === env.ADMIN_USER_ID;
  };

  try {
    // 获取媒体列表
    if (path === 'media' && request.method === 'GET') {
      const { data: media, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return Response.json(media);
    }

    // 上传媒体文件
    if (path === 'media/upload' && request.method === 'POST') {
      const userId = request.headers.get('user-id');
      if (!isAdmin(userId)) {
        return new Response(JSON.stringify({ error: '没有权限' }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const timestamp = Date.now();
          const filename = `${timestamp}-${Math.round(Math.random() * 1E9)}${file.name}`;
          const isVideo = file.type.startsWith('video/');
          const buffer = await file.arrayBuffer();

          // 上传到 S3
          const putCommand = new PutObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: file.type,
          });
          await s3Client.send(putCommand);

          // 使用公开 URL
          const url = `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${filename}`;

          // 保存到 Supabase
          const { data: media, error } = await supabase
            .from('media')
            .insert({
              filename,
              originalname: file.name,
              type: isVideo ? 'video' : 'image',
              url,
              uploaded_by: userId,
            })
            .select()
            .single();

          if (error) throw error;
          return media;
        })
      );

      return Response.json(uploadedFiles);
    }

    // 删除媒体文件
    if (path.startsWith('media/') && request.method === 'DELETE') {
      const userId = request.headers.get('user-id');
      if (!isAdmin(userId)) {
        return new Response(JSON.stringify({ error: '没有权限' }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const id = path.split('/')[1];
      
      // 从 Supabase 获取文件信息
      const { data: media, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !media) {
        return new Response(JSON.stringify({ error: '文件不存在' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 从 S3 删除文件
      const deleteCommand = new DeleteObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: media.filename,
      });
      await s3Client.send(deleteCommand);

      // 从 Supabase 删除记录
      const { error: deleteError } = await supabase
        .from('media')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return Response.json({ message: '删除成功' });
    }

    return new Response(JSON.stringify({ error: '未找到接口' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || '服务器错误' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 