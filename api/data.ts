// api/data.ts - 独立 Vercel Serverless Function
// 不依赖 Express，直接处理请求
// 修复 FUNCTION_INVOCATION_FAILED：移除了 `import app from '../server'` 的复杂导入链

import { createClient } from '@supabase/supabase-js';

// 情绪颜色映射（补充了原始代码中缺失的 "开心"）
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

// 懒加载 Supabase 客户端（每次调用时创建，避免模块级崩溃）
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

// 带超时的 Promise 包装，防止 Supabase 请求挂起
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

// Supabase 同步结果类型
interface SyncResult {
  success: boolean;
  configured: boolean;
  error?: string;
  tableUsed?: string;
}

// 同步记录到 Supabase（返回详细结果用于调试）
async function syncRecordToSupabase(record: {
  id: string;
  device_id: string;
  heart_rate: number;
  emotion: string;
  emotion_color: string;
  created_at: string;
}): Promise<SyncResult> {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !key) {
    return {
      success: false,
      configured: false,
      error: 'Supabase 环境变量未配置 (需要 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY)',
    };
  }

  let client: any = null;
  try {
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    client = createClient(formattedUrl, key);
  } catch (err: any) {
    return { success: false, configured: true, error: '创建 Supabase 客户端失败: ' + err.message };
  }

  // 尝试写入 mood_records 表
  try {
    const doInsert = async (): Promise<SyncResult> => {
      const { error: err1 } = await client.from('mood_records').insert([{
        id: record.id,
        device_id: record.device_id,
        heart_rate: record.heart_rate,
        emotion: record.emotion,
        emotion_color: record.emotion_color,
        created_at: record.created_at,
      }]);

      if (err1) {
        // mood_records 失败，尝试 heart_rate_records 表
        const { error: err2 } = await client.from('heart_rate_records').insert([{
          user_id: record.device_id,
          device_id: record.device_id,
          heart_rate: record.heart_rate,
          emotion: record.emotion,
          created_at: record.created_at,
        }]);

        if (err2) {
          return {
            success: false,
            configured: true,
            error: `mood_records: ${err1.message} | heart_rate_records: ${err2.message}`,
          };
        }
        return { success: true, configured: true, tableUsed: 'heart_rate_records' };
      }
      return { success: true, configured: true, tableUsed: 'mood_records' };
    };

    const result = await withTimeout(doInsert(), 5000);
    if (result === null) {
      return { success: false, configured: true, error: 'Supabase 请求超时 (5s)' };
    }
    return result;
  } catch (err: any) {
    return { success: false, configured: true, error: 'Supabase 异常: ' + err.message };
  }
}

// ===== 主处理函数 =====
export default async function handler(req: any, res: any) {
  // 1. CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let dataObj: any = {};

    // 2. 根据请求方法解析数据
    if (req.method === 'GET') {
      // GET /data?msg={"device_id":"ESP32_MOOD_TEST01","emotion":"开心","heart_rate":88}
      const msgParam = req.query?.msg;

      if (typeof msgParam === 'string' && msgParam.trim()) {
        try {
          dataObj = JSON.parse(msgParam);
        } catch {
          console.error('Failed to parse msg query JSON');
          return res.status(400).json({
            status: 'error',
            message: 'msg 参数不是有效的 JSON',
          });
        }
      } else if (req.query?.device_id || req.query?.deviceId) {
        // 也支持独立查询参数: /data?device_id=xxx&emotion=xxx&heart_rate=88
        dataObj = req.query;
      } else {
        return res.status(400).json({
          status: 'error',
          message: '缺少 msg 参数或 device_id 参数',
        });
      }
    } else if (req.method === 'POST') {
      // POST /data with JSON body
      dataObj = req.body || {};
    } else {
      return res.status(405).json({
        status: 'error',
        message: 'Method not allowed',
      });
    }

    // 3. 提取并校验字段
    const device_id = dataObj.device_id || dataObj.deviceId || 'ESP32_DEFAULT';
    const emotion = dataObj.emotion || '平静';
    const heart_rate = Number(dataObj.heart_rate || dataObj.heartRate || 75);
    const emotion_color =
      dataObj.emotionColor ||
      dataObj.emotion_color ||
      EMOTION_COLOR_MAP[emotion] ||
      '#FFFFFF';

    // 4. 构建记录
    const newRecord = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      device_id: String(device_id),
      heart_rate: isNaN(heart_rate) ? 75 : heart_rate,
      emotion: String(emotion),
      emotion_color: String(emotion_color),
      created_at: new Date().toISOString(),
    };

    // 5. 同步到 Supabase（返回详细诊断信息）
    const syncResult = await syncRecordToSupabase(newRecord);

    // 6. 返回响应（包含 Supabase 诊断信息）
    return res.status(200).json({
      status: 'ok',
      received: {
        device_id: newRecord.device_id,
        emotion: newRecord.emotion,
        heart_rate: newRecord.heart_rate,
      },
      supabase: syncResult,
    });
  } catch (error: any) {
    // 兜底：捕获所有未被内层 try/catch 处理的异常
    console.error('Error handling /data:', error);
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Unknown error',
    });
  }
}
