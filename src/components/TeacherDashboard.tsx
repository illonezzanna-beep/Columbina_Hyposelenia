import React, { useState, useEffect, useMemo, useCallback } from 'react';
import mqtt from 'mqtt';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Search, Activity, Heart, Thermometer, ShieldAlert, 
  Wifi, WifiOff, History, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MqttEmotionData, EMOTION_MAP, DatabaseRecord } from '../types';
import { cn } from '../lib/utils';

const BROKER_LIST = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt'
];

const MQTT_TOPIC = import.meta.env.VITE_MQTT_TOPIC || 'emotion/weather/station';

const getSanitizedBrokerUrl = (rawUrl?: string): string => {
  let url = (rawUrl || '').trim();
  if (!url) {
    url = BROKER_LIST[0];
  }
  if (!/^wss?:\/\//i.test(url) && !/^mqtts?:\/\//i.test(url)) {
    url = 'wss://' + url.replace(/^:\/\//, '');
  }
  return url;
};

// 情绪等级映射 (Y轴从上到下: 0=兴奋, 1=开心, 2=愉悦, 3=平静, 4=悲伤, 5=愤怒, 6=焦虑, 7=恐惧)
const EMOTION_LEVELS = [
  { name: '兴奋', level: 0, color: '#FFC0CB' },
  { name: '开心', level: 1, color: '#FFD700' },
  { name: '愉悦', level: 2, color: '#FFB6C1' },
  { name: '平静', level: 3, color: '#CBD5E1' },
  { name: '悲伤', level: 4, color: '#3B82F6' },
  { name: '愤怒', level: 5, color: '#EF4444' },
  { name: '焦虑', level: 6, color: '#22C55E' },
  { name: '恐惧', level: 7, color: '#A855F7' },
];

const EMOTION_TO_LEVEL: Record<string, number> = {};
EMOTION_LEVELS.forEach(e => { EMOTION_TO_LEVEL[e.name] = e.level; });

function getEmotionColor(emotion: string): string {
  const found = EMOTION_LEVELS.find(e => e.name === emotion);
  if (found) return found.color;
  // Fallback to EMOTION_MAP from types
  const map: Record<string, string> = {
    '平静': '#FFFFFF', '愉悦': '#FFB6C1', '兴奋': '#FFC0CB',
    '焦虑': '#00FF00', '愤怒': '#FF0000', '恐惧': '#800080',
    '悲伤': '#0000FF', '开心': '#FFD700',
  };
  return map[emotion] || '#6366f1';
}

export const TeacherDashboard: React.FC = () => {
  const [deviceId, setDeviceId] = useState('');
  const [searchId, setSearchId] = useState('');
  const [data, setData] = useState<MqttEmotionData[]>([]);
  const [dbRecords, setDbRecords] = useState<DatabaseRecord[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [currentBrokerIndex, setCurrentBrokerIndex] = useState(0);
  const [lastMessage, setLastMessage] = useState<MqttEmotionData | null>(null);

  const customBroker = import.meta.env.VITE_MQTT_BROKER;
  const activeBrokerUrl = customBroker ? getSanitizedBrokerUrl(customBroker) : BROKER_LIST[currentBrokerIndex];

  useEffect(() => {
    let client: mqtt.MqttClient | null = null;
    let failCount = 0;
    setConnectionStatus('connecting');

    try {
      client = mqtt.connect(activeBrokerUrl, {
        clientId: 'mood_station_' + Math.random().toString(16).substring(2, 10),
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 10000,
        keepalive: 60,
      });

      client.on('connect', () => {
        console.log(`Connected to MQTT Broker: ${activeBrokerUrl}`);
        setIsConnected(true);
        setConnectionStatus('connected');
        failCount = 0;
        client?.subscribe(MQTT_TOPIC, (err) => {
          if (!err) console.log(`Subscribed to ${MQTT_TOPIC}`);
        });
      });

      client.on('message', (topic, message) => {
        try {
          const payload: MqttEmotionData = JSON.parse(message.toString());
          setLastMessage(payload);
          setData(prev => [...prev.slice(-49), payload]); // Keep last 50 points
        } catch (e) {
          console.error('Failed to parse MQTT message', e);
        }
      });

      client.on('error', (err) => {
        console.warn(`MQTT error on [${activeBrokerUrl}]:`, err?.message || err);
        setIsConnected(false);
        setConnectionStatus('error');
        failCount++;

        // If current public broker keeps failing, switch to fallback broker
        if (!customBroker && failCount >= 2) {
          setCurrentBrokerIndex(prev => (prev + 1) % BROKER_LIST.length);
        }
      });
    } catch (err) {
      console.error('Failed to initialize MQTT connection:', err);
      setIsConnected(false);
      setConnectionStatus('error');
    }

    return () => {
      if (client) {
        try {
          client.end(true);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [activeBrokerUrl, customBroker]);

  // 从数据库 /api/records 获取历史数据（用于图表和历史数据流）
  const fetchDbRecords = useCallback(async () => {
    try {
      const filterParam = searchId ? `?device_id=${encodeURIComponent(searchId)}` : '';
      const res = await fetch(`/api/records${filterParam}`);
      if (res.ok) {
        const json = await res.json();
        if (json.records) {
          // 过滤掉 emotion='启动' 的记录
          const filtered = json.records.filter((r: DatabaseRecord) => r.emotion !== '启动');
          setDbRecords(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to fetch database records:', err);
    } finally {
      setIsLoadingDb(false);
    }
  }, [searchId]);

  useEffect(() => {
    fetchDbRecords();
    const interval = setInterval(fetchDbRecords, 8000);
    return () => clearInterval(interval);
  }, [fetchDbRecords]);

  // 将数据库记录转换并按时间正序排列（旧→新），用于绘制曲线
  const chartData = useMemo(() => {
    return [...dbRecords]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(r => ({
        timestamp: r.created_at,
        heartRate: r.heart_rate,
        emotion: r.emotion,
        emotionColor: r.emotion_color || getEmotionColor(r.emotion),
        deviceId: r.device_id,
        emotionLevel: EMOTION_TO_LEVEL[r.emotion] ?? 3,
      }));
  }, [dbRecords]);

  const filteredData = useMemo(() => {
    return chartData;
  }, [chartData]);

  const currentDevice = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData[chartData.length - 1];
  }, [chartData]);

  // 图表数据已直接从 chartData 获取（包含 emotionLevel 字段）
  const emotionChartData = chartData;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchId(deviceId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-4xl font-bold text-gray-900">情绪趋势控制台</h2>
            {connectionStatus === 'connected' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                <Wifi className="w-3 h-3 text-emerald-600" /> MQTT 实时已连接
              </span>
            ) : connectionStatus === 'connecting' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200 animate-pulse">
                <Wifi className="w-3 h-3 text-amber-600 animate-spin" /> 连接 Broker 中...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                <WifiOff className="w-3 h-3 text-slate-500" /> HTTP 数据同步模式
              </span>
            )}
            
            {!customBroker && (
              <button
                type="button"
                onClick={() => setCurrentBrokerIndex(prev => (prev + 1) % BROKER_LIST.length)}
                className="text-[11px] font-mono text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-gray-200 transition-all"
                title="点击切换 MQTT 服务器"
              >
                Broker: {activeBrokerUrl.replace('wss://', '').split('/')[0]} ⚡ 切换
              </button>
            )}
          </div>
          <p className="text-gray-500">通过输入设备 ID 实时调取学生或个人情绪变动曲线。</p>
        </div>

        <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="搜索设备 ID (例如 device_001)"
              className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          <button type="submit" className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
            查询
          </button>
        </form>
      </div>

      {isLoadingDb ? (
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 text-center flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-300">
            <History className="w-10 h-10 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">正在加载历史数据...</h3>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 text-center flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-300">
            <History className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无历史数据</h3>
          <p className="text-gray-500 max-w-xs">
            {searchId
              ? `设备 ID "${searchId}" 在数据库中暂无记录，请确认设备 ID 或等待数据上报。`
              : '数据库中暂无情绪记录，请通过数据上报页面上传数据后再查看。'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Emotion Timeline Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                    情绪轨迹追踪
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400">
                    {EMOTION_LEVELS.map(e => (
                      <span key={e.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color, border: e.color === '#FFFFFF' || e.color === '#CBD5E1' ? '1px solid #cbd5e1' : 'none' }} />
                        {e.name}
                      </span>
                    ))}
                  </div>
               </div>

               <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emotionChartData}>
                      <defs>
                        <linearGradient id="emotionLineGradient" x1="0" y1="0" x2="1" y2="0">
                          {emotionChartData.length > 0 && emotionChartData.map((d, i) => (
                            <stop
                              key={i}
                              offset={emotionChartData.length > 1 ? `${(i / (emotionChartData.length - 1)) * 100}%` : '0%'}
                              stopColor={getEmotionColor(d.emotion)}
                              stopOpacity={1}
                            />
                          ))}
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        type="number"
                        domain={[-0.5, 7.5]}
                        ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                        tickFormatter={(level) => EMOTION_LEVELS[level]?.name || ''}
                        tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as MqttEmotionData & { emotionLevel: number };
                            return (
                              <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 shadow-2xl">
                                <div className="text-xs font-bold text-gray-500 mb-2">
                                  {new Date(d.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getEmotionColor(d.emotion) }} />
                                  <span className="text-white font-bold text-lg">{d.emotion}</span>
                                </div>
                                <div className="text-indigo-400 font-black text-xl">
                                  {d.heartRate} <span className="text-xs opacity-50">BPM</span>
                                </div>
                                <div className="text-gray-500 text-xs mt-1">设备: {d.deviceId}</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="emotionLevel"
                        stroke="url(#emotionLineGradient)"
                        strokeWidth={3}
                        dot={(props: any) => {
                          const { cx, cy, payload, index } = props;
                          if (cx == null || cy == null) return <g key={index} />;
                          const color = getEmotionColor(payload.emotion);
                          return (
                            <circle
                              key={index}
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={color}
                              stroke={color === '#FFFFFF' || color === '#CBD5E1' ? '#cbd5e1' : color}
                              strokeWidth={1}
                              style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
                            />
                          );
                        }}
                        activeDot={{ r: 6, fill: '#6366f1' }}
                        connectNulls
                        animationDuration={500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>

          {/* History Feed */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">历史数据流</h3>
              <button 
                onClick={() => fetchDbRecords()}
                className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                刷新数据
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              <AnimatePresence initial={false}>
                {[...filteredData].reverse().map((record, index) => (
                  <motion.div
                    key={record.timestamp + index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-white transiton-all"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shadow-lg"
                        style={{ backgroundColor: record.emotionColor }}
                      >
                         {record.heartRate}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{record.emotion}</div>
                        <div className="text-xs text-gray-400 font-medium">设备：{record.deviceId}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-500">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
