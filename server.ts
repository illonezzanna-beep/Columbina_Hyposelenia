import express from 'express';
import path from 'path';
import fs from 'fs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface MoodRecord {
  id: string;
  device_id: string;
  heart_rate: number;
  emotion: string;
  emotion_color: string;
  created_at: string;
}

const EMOTION_COLOR_MAP: Record<string, string> = {
  '平静': '#FFFFFF',
  '愉悦': '#FFB6C1',
  '兴奋': '#FFC0CB',
  '焦虑': '#00FF00',
  '愤怒': '#FF0000',
  '恐惧': '#800080',
  '悲伤': '#0000FF',
  'Calm': '#FFFFFF',
  'Joy': '#FFB6C1',
  'Excited': '#FFC0CB',
  'Anxious': '#00FF00',
  'Anger': '#FF0000',
  'Fear': '#800080',
  'Sad': '#0000FF'
};

// Lazy initialization for Supabase Client
const getSupabaseClient = (): SupabaseClient | null => {
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
};

// Initial sample data so database & charts are instantly interactive
const INITIAL_RECORDS: MoodRecord[] = [
  { id: '1', device_id: 'ESP32_MOOD_A01', heart_rate: 75, emotion: '平静', emotion_color: '#FFFFFF', created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: '2', device_id: 'ESP32_MOOD_A01', heart_rate: 82, emotion: '愉悦', emotion_color: '#FFB6C1', created_at: new Date(Date.now() - 3600000 * 4.5).toISOString() },
  { id: '3', device_id: 'ESP32_MOOD_A02', heart_rate: 96, emotion: '兴奋', emotion_color: '#FFC0CB', created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: '4', device_id: 'ESP32_MOOD_A01', heart_rate: 105, emotion: '焦虑', emotion_color: '#00FF00', created_at: new Date(Date.now() - 3600000 * 3.5).toISOString() },
  { id: '5', device_id: 'ESP32_MOOD_A03', heart_rate: 72, emotion: '平静', emotion_color: '#FFFFFF', created_at: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: '6', device_id: 'ESP32_MOOD_A02', heart_rate: 78, emotion: '愉悦', emotion_color: '#FFB6C1', created_at: new Date(Date.now() - 3600000 * 2.5).toISOString() },
  { id: '7', device_id: 'ESP32_MOOD_A01', heart_rate: 118, emotion: '愤怒', emotion_color: '#FF0000', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: '8', device_id: 'ESP32_MOOD_A03', heart_rate: 65, emotion: '悲伤', emotion_color: '#0000FF', created_at: new Date(Date.now() - 3600000 * 1.5).toISOString() },
  { id: '9', device_id: 'ESP32_MOOD_A01', heart_rate: 125, emotion: '恐惧', emotion_color: '#800080', created_at: new Date(Date.now() - 3600000 * 1).toISOString() },
  { id: '10', device_id: 'ESP32_MOOD_A02', heart_rate: 74, emotion: '平静', emotion_color: '#FFFFFF', created_at: new Date(Date.now() - 3600000 * 0.5).toISOString() }
];

const DATA_FILE = process.env.VERCEL ? '/tmp/mood_records_db.json' : path.join(process.cwd(), 'mood_records_db.json');

function loadRecordsFromStorage(): MoodRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load records from storage, using memory/defaults:', err);
  }
  return [...INITIAL_RECORDS];
}

function saveRecordsToStorage(records: MoodRecord[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist records to disk:', err);
  }
}

let dbRecords: MoodRecord[] = loadRecordsFromStorage();

// Helper to execute promises with a max timeout
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 2500): Promise<T | null> => {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
  ]);
};

// Sync record to Supabase asynchronously
const syncRecordToSupabase = async (record: MoodRecord) => {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const doInsert = async () => {
      const { error: err1 } = await client.from('mood_records').insert([{
        id: record.id,
        device_id: record.device_id,
        heart_rate: record.heart_rate,
        emotion: record.emotion,
        emotion_color: record.emotion_color,
        created_at: record.created_at
      }]);

      if (err1) {
        // Fallback to heart_rate_records table
        await client.from('heart_rate_records').insert([{
          user_id: record.device_id,
          device_id: record.device_id,
          heart_rate: record.heart_rate,
          emotion: record.emotion,
          created_at: record.created_at
        }]);
      }
    };
    await withTimeout(doInsert(), 3000);
  } catch (err) {
    console.error('Failed to sync record to Supabase:', err);
  }
};

// Fetch records from Supabase
const getRecordsFromSupabase = async (): Promise<MoodRecord[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const fetchQuery = async (): Promise<MoodRecord[] | null> => {
      const { data: data1, error: err1 } = await client
        .from('mood_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (!err1 && data1 && data1.length > 0) {
        return data1.map(r => ({
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
        .limit(300);

      if (!err2 && data2 && data2.length > 0) {
        return data2.map(r => ({
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

    return await withTimeout(fetchQuery(), 2500);
  } catch (err) {
    console.error('Error querying Supabase:', err);
  }
  return null;
};

export const app = express();

const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for external device / testing calls
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

  // Health check API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Supabase Status check
  app.get('/api/supabase-status', async (_req, res) => {
    const client = getSupabaseClient();
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    if (!client) {
      return res.json({
        configured: false,
        url: url || null,
        message: 'Supabase 未配置 (缺少 VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)'
      });
    }

    try {
      const { error: err1 } = await client.from('mood_records').select('id', { count: 'exact', head: true });
      if (!err1) {
        return res.json({
          configured: true,
          connected: true,
          url,
          tableUsed: 'mood_records',
          message: '已正常连接外网 Supabase 数据库 (表: mood_records)'
        });
      }

      const { error: err2 } = await client.from('heart_rate_records').select('id', { count: 'exact', head: true });
      if (!err2) {
        return res.json({
          configured: true,
          connected: true,
          url,
          tableUsed: 'heart_rate_records',
          message: '已正常连接外网 Supabase 数据库 (表: heart_rate_records)'
        });
      }

      res.json({
        configured: true,
        connected: false,
        url,
        message: '已配置 Supabase 密钥，但在独立数据库中未找到 mood_records 或 heart_rate_records 表，请通过 SQL 创建表。'
      });
    } catch (err: any) {
      res.json({
        configured: true,
        connected: false,
        url,
        message: '连接 Supabase 时出现异常: ' + err.message
      });
    }
  });

  // 1. Data Upload Endpoint
  // Supports format: {"device_id":"ESP32_MOOD_A01","emotion":"平静","heart_rate":75}
  const handleUpload = (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const device_id = body.device_id || body.deviceId || 'ESP32_DEFAULT';
      const emotion = body.emotion || '平静';
      const heart_rate = Number(body.heart_rate || body.heartRate || 75);
      const emotion_color = body.emotionColor || body.emotion_color || EMOTION_COLOR_MAP[emotion] || '#FFFFFF';
      const timestamp = body.timestamp || new Date().toISOString();

      const newRecord: MoodRecord = {
        id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        device_id: String(device_id),
        heart_rate: isNaN(heart_rate) ? 75 : heart_rate,
        emotion: String(emotion),
        emotion_color: String(emotion_color),
        created_at: timestamp
      };

      dbRecords.unshift(newRecord);
      if (dbRecords.length > 2000) {
        dbRecords = dbRecords.slice(0, 2000);
      }
      saveRecordsToStorage(dbRecords);

      // Async sync to external Supabase
      syncRecordToSupabase(newRecord).catch(() => {});

      res.status(201).json({
        success: true,
        message: '数据解析成功并保存存入数据库',
        received: {
          device_id,
          emotion,
          heart_rate
        },
        saved_record: newRecord,
        total_count: dbRecords.length
      });
    } catch (error: any) {
      console.error('Error handling upload:', error);
      res.status(400).json({
        success: false,
        error: '格式错误或包含无效数据',
        details: error.message
      });
    }
  };

  app.post(['/data', '/api/data', '/api/upload', '/api/mood', '/api', '/api/index', '/api/index.ts'], handleUpload);

  // GET /data endpoint for ESP32 receiving msg query string JSON
  // Example: GET /data?msg={"device_id":"ESP32_MOOD_A01","emotion":"平静","heart_rate":78}
  const handleGetDataUpload = (req: express.Request, res: express.Response) => {
    try {
      let dataObj: any = {};
      const msgParam = req.query.msg;

      if (typeof msgParam === 'string' && msgParam.trim()) {
        try {
          dataObj = JSON.parse(msgParam);
        } catch (err) {
          console.error('Failed to parse msg query JSON:', err);
          dataObj = {};
        }
      } else if (req.query.device_id || req.query.deviceId) {
        dataObj = req.query;
      }

      const device_id = dataObj.device_id || dataObj.deviceId || 'ESP32_DEFAULT';
      const emotion = dataObj.emotion || '平静';
      const heart_rate = Number(dataObj.heart_rate || dataObj.heartRate || 75);
      const emotion_color = dataObj.emotionColor || dataObj.emotion_color || EMOTION_COLOR_MAP[emotion] || '#FFFFFF';
      const timestamp = new Date().toISOString();

      const newRecord: MoodRecord = {
        id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        device_id: String(device_id),
        heart_rate: isNaN(heart_rate) ? 75 : heart_rate,
        emotion: String(emotion),
        emotion_color: String(emotion_color),
        created_at: timestamp
      };

      dbRecords.unshift(newRecord);
      if (dbRecords.length > 2000) {
        dbRecords = dbRecords.slice(0, 2000);
      }
      saveRecordsToStorage(dbRecords);

      // Async sync to external Supabase
      syncRecordToSupabase(newRecord).catch(() => {});

      res.status(200).json({ status: "ok" });
    } catch (error: any) {
      console.error('Error handling GET /data:', error);
      res.status(400).json({ status: "error", message: error?.message || 'Unknown error' });
    }
  };

  app.get(['/data', '/api/data', '/api', '/api/index', '/api/index.ts'], handleGetDataUpload);

  // 2. Fetch Records Endpoint
  app.get('/api/records', async (req, res) => {
    const filterDevice = (req.query.device_id || req.query.deviceId) as string;
    
    // Try reading from Supabase
    const spRecords = await getRecordsFromSupabase();
    let recordsToUse = spRecords && spRecords.length > 0 ? spRecords : dbRecords;

    if (filterDevice) {
      recordsToUse = recordsToUse.filter(r => r.device_id.toLowerCase() === filterDevice.toLowerCase());
    }

    res.json({
      success: true,
      records: recordsToUse,
      totalCount: recordsToUse.length,
      allDevices: Array.from(new Set(recordsToUse.map(r => r.device_id))),
      isSupabaseActive: !!(spRecords && spRecords.length > 0)
    });
  });

  // 3. Get Pie Chart Statistics Endpoint
  app.get('/api/stats', async (req, res) => {
    const filterDevice = (req.query.device_id || req.query.deviceId) as string;
    
    const spRecords = await getRecordsFromSupabase();
    let records = spRecords && spRecords.length > 0 ? spRecords : dbRecords;

    if (filterDevice) {
      records = records.filter(r => r.device_id.toLowerCase() === filterDevice.toLowerCase());
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

    res.json({
      success: true,
      totalRecords,
      avgHeartRate: totalRecords > 0 ? Math.round(totalHr / totalRecords) : 0,
      deviceCount: uniqueDevices.length,
      allDevices: uniqueDevices,
      pieChartData,
      isSupabaseActive: !!(spRecords && spRecords.length > 0)
    });
  });

  // 4. Delete / Reset Data
  app.delete('/api/records', async (_req, res) => {
    dbRecords = [...INITIAL_RECORDS];
    saveRecordsToStorage(dbRecords);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('mood_records').delete().neq('id', '0');
        await client.from('heart_rate_records').delete().neq('user_id', '0');
      } catch (e) {
        console.error('Error clearing Supabase records:', e);
      }
    }

    res.json({
      success: true,
      message: '数据库已重置为初始测试数据',
      totalRecords: dbRecords.length
    });
  });

async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Mood Light Station Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error('Fatal server start error:', err);
  });
}

export default app;

