// api/supabase-status.ts - Standalone Vercel Serverless Function
// 检查 Supabase 连接状态，不依赖 Express

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !key) {
    return res.status(200).json({
      configured: false,
      connected: false,
      url: url || null,
      message: 'Supabase 未配置 (缺少 VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)'
    });
  }

  let formattedUrl = url;
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }

  let client: any = null;
  try {
    client = createClient(formattedUrl, key);
  } catch (err: any) {
    return res.status(200).json({
      configured: true,
      connected: false,
      url,
      message: '创建 Supabase 客户端失败: ' + err.message
    });
  }

  // 带超时的表检查
  const checkTable = async (tableName: string): Promise<boolean> => {
    try {
      const { error } = await client
        .from(tableName)
        .select('id', { count: 'exact', head: true })
        .limit(1);
      return !error;
    } catch {
      return false;
    }
  };

  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 5000);
    });

    const checkPromise = (async () => {
      if (await checkTable('mood_records')) {
        return { table: 'mood_records', ok: true };
      }
      if (await checkTable('heart_rate_records')) {
        return { table: 'heart_rate_records', ok: true };
      }
      return { table: null, ok: false };
    })();

    const result = await Promise.race([checkPromise, timeoutPromise]);

    if (result === null) {
      return res.status(200).json({
        configured: true,
        connected: false,
        url,
        message: 'Supabase 请求超时 (5s)'
      });
    }

    if (result.ok) {
      return res.status(200).json({
        configured: true,
        connected: true,
        url,
        tableUsed: result.table,
        message: `已正常连接外网 Supabase 数据库 (表: ${result.table})`
      });
    }

    return res.status(200).json({
      configured: true,
      connected: false,
      url,
      message: '已配置 Supabase 密钥，但在独立数据库中未找到 mood_records 或 heart_rate_records 表，请通过 SQL 创建表。'
    });
  } catch (err: any) {
    return res.status(200).json({
      configured: true,
      connected: false,
      url,
      message: '连接 Supabase 时出现异常: ' + err.message
    });
  }
}
