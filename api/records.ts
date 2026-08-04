// api/records.ts - Standalone Vercel Serverless Function
// 直接从 Supabase 数据库获取记录列表，支持设备筛选与删除重置
// 不依赖 Express，避免 FUNCTION_INVOCATION_FAILED

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

interface MoodRecord {
  id: string;
  device_id: string;
  heart_rate: number;
  emotion: string;
  emotion_color: string;
  created_at: string;
}

async function getRecordsFromSupabase(): Promise<MoodRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const fetchQuery = async (): Promise<MoodRecord[] | null> => {
      const { data: data1, error: err1 } = await client
        .from('mood_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!err1 && data1 && data1.length > 0) {
        return data1.map((r: any) => ({
          id: String(r.id),
          device_id: r.device_id || 'ESP32_DEFAULT',
          heart_rate: Number(r.heart_rate) || 75,
          emotion: r.emotion || '平静',
          emotion_color: r.emotion_color || EMOTION_COLOR_MAP[r.emotion] || '#FFFFFF',
          created_at: r.created_at || new Date().toISOString()
        }));
      }

      const { data: data2, error: err2 } = await client
        .from('heart_rate_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!err2 && data2 && data2.length > 0) {
        return data2.map((r: any) => ({
          id: String(r.id),
          device_id: r.device_id || r.user_id || 'ESP32_DEFAULT',
          heart_rate: Number(r.heart_rate) || 75,
          emotion: r.emotion || '平静',
          emotion_color: EMOTION_COLOR_MAP[r.emotion] || '#FFFFFF',
          created_at: r.created_at || new Date().toISOString()
        }));
      }
      return null;
    };

    return await withTimeout(fetchQuery(), 5000);
  } catch (err) {
    console.error('Error querying Supabase:', err);
  }
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: 获取记录列表
  if (req.method === 'GET') {
    try {
      const filterDevice = req.query?.device_id || req.query?.deviceId;

      const spRecords = await getRecordsFromSupabase();

      if (!spRecords || spRecords.length === 0) {
        return res.status(200).json({
          success: true,
          records: [],
          totalCount: 0,
          allDevices: [],
          isSupabaseActive: !!(getSupabaseClient()),
        });
      }

      let recordsToUse = spRecords;
      if (filterDevice) {
        recordsToUse = recordsToUse.filter(r => r.device_id.toLowerCase() === String(filterDevice).toLowerCase());
      }

      return res.status(200).json({
        success: true,
        records: recordsToUse,
        totalCount: recordsToUse.length,
        allDevices: Array.from(new Set(spRecords.map(r => r.device_id))),
        isSupabaseActive: true
      });
    } catch (error: any) {
      console.error('Error in GET /api/records:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Unknown error'
      });
    }
  }

  // DELETE: 重置数据库（清空所有记录）
  if (req.method === 'DELETE') {
    const client = getSupabaseClient();
    if (!client) {
      return res.status(200).json({
        success: false,
        message: 'Supabase 未配置，无法重置'
      });
    }

    try {
      await client.from('mood_records').delete().neq('id', '0');
      await client.from('heart_rate_records').delete().neq('user_id', '0');

      return res.status(200).json({
        success: true,
        message: '数据库已清空重置',
        totalRecords: 0
      });
    } catch (error: any) {
      console.error('Error clearing Supabase records:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to clear records'
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
