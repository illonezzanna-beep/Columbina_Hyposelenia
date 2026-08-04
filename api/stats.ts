// api/stats.ts - Standalone Vercel Serverless Function
// 直接从 Supabase 数据库获取统计数据（总记录、平均心率、心情分布等）
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
      // 优先查询 mood_records 表
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

      // 回退到 heart_rate_records 表
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const filterDevice = req.query?.device_id || req.query?.deviceId;

    const spRecords = await getRecordsFromSupabase();

    if (!spRecords || spRecords.length === 0) {
      return res.status(200).json({
        success: true,
        totalRecords: 0,
        avgHeartRate: 0,
        deviceCount: 0,
        allDevices: [],
        pieChartData: [],
        isSupabaseActive: !!(getSupabaseClient()),
      });
    }

    let records = spRecords;
    if (filterDevice) {
      records = records.filter(r => r.device_id.toLowerCase() === String(filterDevice).toLowerCase());
    }

    const totalRecords = records.length;
    const emotionCounts: Record<string, number> = {};
    const emotionColors: Record<string, string> = {};
    let totalHr = 0;

    records.forEach(r => {
      emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
      if (!emotionColors[r.emotion]) {
        emotionColors[r.emotion] = r.emotion_color || EMOTION_COLOR_MAP[r.emotion] || '#6366f1';
      }
      totalHr += r.heart_rate;
    });

    const pieChartData = Object.keys(emotionCounts).map(emotion => ({
      name: emotion,
      count: emotionCounts[emotion],
      percentage: totalRecords > 0 ? Number(((emotionCounts[emotion] / totalRecords) * 100).toFixed(1)) : 0,
      color: emotionColors[emotion] || '#6366f1'
    }));

    const uniqueDevices = Array.from(new Set(records.map(r => r.device_id)));

    return res.status(200).json({
      success: true,
      totalRecords,
      avgHeartRate: totalRecords > 0 ? Math.round(totalHr / totalRecords) : 0,
      deviceCount: uniqueDevices.length,
      allDevices: uniqueDevices,
      pieChartData,
      isSupabaseActive: true
    });
  } catch (error: any) {
    console.error('Error in /api/stats:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error'
    });
  }
}
