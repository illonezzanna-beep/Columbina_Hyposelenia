// api/upload.ts - Standalone Vercel Serverless Function
// 处理 POST 数据上传，直接写入 Supabase，不依赖 Express

import { createClient } from '@supabase/supabase-js';

const EMOTION_COLOR_MAP: Record<string, string> = {
  '平静': '#FFFFFF',
  '愉悦': '#FFB6C1',
  '兴奋': '#FFC0CB',
  '焦虑': '#00FF00',
  '愤怒': '#FF0000',
  '恐惧': '#800080',
  '悲伤': '#0000FF',
  '开心': '#FFD700',
  'Calm': '#FFFFFF',
  'Joy': '#FFB6C1',
  'Excited': '#FFC0CB',
  'Anxious': '#00FF00',
  'Anger': '#FF0000',
  'Fear': '#800080',
  'Sad': '#0000FF',
};

function getSupabaseClient(): any | null {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return null;

  let formattedUrl = url;
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }
  try {
    return createClient(formattedUrl, key);
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const device_id = body.device_id || body.deviceId || 'ESP32_DEFAULT';
    const emotion = body.emotion || '平静';
    const heart_rate = Number(body.heart_rate || body.heartRate || 75);
    const emotion_color = body.emotionColor || body.emotion_color || EMOTION_COLOR_MAP[emotion] || '#FFFFFF';
    const timestamp = body.timestamp || new Date().toISOString();

    const newRecord = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      device_id: String(device_id),
      heart_rate: isNaN(heart_rate) ? 75 : heart_rate,
      emotion: String(emotion),
      emotion_color: String(emotion_color),
      created_at: timestamp
    };

    // 写入 Supabase
    const client = getSupabaseClient();
    if (!client) {
      return res.status(200).json({
        success: false,
        error: 'Supabase 未配置 (缺少环境变量)',
        received: { device_id, emotion, heart_rate }
      });
    }

    const doInsert = async () => {
      // 优先写入 mood_records 表
      const { error: err1 } = await client.from('mood_records').insert([{
        id: newRecord.id,
        device_id: newRecord.device_id,
        heart_rate: newRecord.heart_rate,
        emotion: newRecord.emotion,
        emotion_color: newRecord.emotion_color,
        created_at: newRecord.created_at,
      }]);

      if (err1) {
        // 回退到 heart_rate_records 表
        const { error: err2 } = await client.from('heart_rate_records').insert([{
          user_id: newRecord.device_id,
          device_id: newRecord.device_id,
          heart_rate: newRecord.heart_rate,
          emotion: newRecord.emotion,
          created_at: newRecord.created_at,
        }]);

        if (err2) {
          // 精简插入（兼容旧表结构，无 device_id 列）
          const { error: err3 } = await client.from('heart_rate_records').insert([{
            user_id: newRecord.device_id,
            heart_rate: newRecord.heart_rate,
            emotion: newRecord.emotion,
            created_at: newRecord.created_at,
          }]);

          if (err3) {
            throw new Error(`mood_records: ${err1.message} | heart_rate_records: ${err3.message}`);
          }
        }
      }
    };

    const result = await withTimeout(doInsert(), 5000);
    if (result === null) {
      return res.status(200).json({
        success: false,
        error: 'Supabase 写入超时 (5s)',
        received: { device_id, emotion, heart_rate }
      });
    }

    return res.status(201).json({
      success: true,
      message: '数据解析成功并保存存入数据库',
      received: { device_id, emotion, heart_rate },
      saved_record: newRecord
    });
  } catch (error: any) {
    console.error('Error in POST /api/upload:', error);
    return res.status(400).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
}
