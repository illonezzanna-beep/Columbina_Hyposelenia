import React, { useState, useEffect, useMemo } from 'react';
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
import { MqttEmotionData, EMOTION_MAP } from '../types';
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

export const TeacherDashboard: React.FC = () => {
  const [deviceId, setDeviceId] = useState('');
  const [searchId, setSearchId] = useState('');
  const [data, setData] = useState<MqttEmotionData[]>([]);
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

  const filteredData = useMemo(() => {
    if (!searchId) return data;
    return data.filter(d => d.deviceId === searchId);
  }, [data, searchId]);

  const currentDevice = useMemo(() => {
    if (!searchId) return lastMessage;
    return [...data].reverse().find(d => d.deviceId === searchId) || null;
  }, [data, searchId, lastMessage]);

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
          <p className="text-gray-500">通过输入设备 ID 实时调取班级或个人情绪变动曲线。</p>
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

      {searchId && filteredData.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 text-center flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-300">
            <History className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">未找到实时数据</h3>
          <p className="text-gray-500 max-w-xs">当前设备 ID "{searchId}" 尚未上传实时情绪包，请检查硬件连接状态。</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Real-time Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">实时心情状态</div>
                <div className="flex items-center gap-4 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg" 
                    style={{ 
                      backgroundColor: currentDevice?.emotionColor || '#f0f0f0',
                      boxShadow: `0 0 15px ${currentDevice?.emotionColor || 'transparent'}`
                    }} 
                  />
                  <span className="text-3xl font-black text-gray-900">
                    {currentDevice?.emotion || '等待中'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  设备：{currentDevice?.deviceId || '全频道'}
                </p>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                   <div className="text-2xl font-black text-gray-900 leading-none">
                     {currentDevice?.heartRate || '--'}
                   </div>
                   <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">BPM 心率值</div>
                </div>
              </div>
            </div>

            {/* Main Trend Chart */}
            <div className="md:col-span-3 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-indigo-500" />
                    情绪轨迹追踪
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <span className="w-3 h-3 rounded-full bg-indigo-500" /> 心率趋势
                  </div>
               </div>
               
               <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData}>
                      <defs>
                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="timestamp" 
                        hide 
                      />
                      <YAxis 
                        domain={['dataMin - 10', 'dataMax + 10']} 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as MqttEmotionData;
                            return (
                              <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 shadow-2xl">
                                <div className="text-xs font-bold text-gray-500 mb-2">{new Date(d.timestamp).toLocaleTimeString()}</div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.emotionColor }} />
                                  <span className="text-white font-bold">{d.emotion}</span>
                                </div>
                                <div className="text-indigo-400 font-black text-xl">{d.heartRate} <span className="text-xs opacity-50">BPM</span></div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="heartRate" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorHr)" 
                        animationDuration={500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
               
               <div className="mt-6 flex gap-2">
                  {filteredData.slice(-10).map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex-1 h-2 rounded-full"
                      style={{ backgroundColor: d.emotionColor }}
                    />
                  ))}
               </div>
            </div>
          </div>

          {/* History Feed */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">历史数据流</h3>
              <button 
                onClick={() => setData([])}
                className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                重置流
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
