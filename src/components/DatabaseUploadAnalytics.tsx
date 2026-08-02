import React, { useState, useEffect, useCallback } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Upload, Copy, Check, Server, PieChart as PieIcon, Database, 
  RefreshCw, Send, Terminal, Cpu, HardDrive, ArrowUpRight, Filter, AlertCircle, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseRecord, DatabaseStats, PieChartItem, EMOTION_MAP } from '../types';

export const DatabaseUploadAnalytics: React.FC = () => {
  // Upload Tester Form state
  const [deviceId, setDeviceId] = useState('ESP32_MOOD_A01');
  const [emotion, setEmotion] = useState('平静');
  const [heartRate, setHeartRate] = useState(75);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);

  // Database Records & Stats state
  const [records, setRecords] = useState<DatabaseRecord[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'tester' | 'code'>('analytics');

  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    url?: string;
    tableUsed?: string;
    message?: string;
  } | null>(null);

  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [copiedGetLink, setCopiedGetLink] = useState(false);

  const getEndpoint = typeof window !== 'undefined'
    ? `${window.location.origin}/data`
    : '/data';

  const uploadEndpoint = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/upload`
    : '/api/upload';

  const sampleJsonStr = JSON.stringify({
    device_id: deviceId.trim() || 'ESP32_MOOD_A01',
    emotion: emotion,
    heart_rate: Number(heartRate) || 78
  });

  const getFullUrl = `${getEndpoint}?msg=${encodeURIComponent(sampleJsonStr)}`;

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterParam = selectedDeviceFilter !== 'ALL' ? `?device_id=${encodeURIComponent(selectedDeviceFilter)}` : '';
      
      const [recRes, statsRes, spRes] = await Promise.all([
        fetch(`/api/records${filterParam}`),
        fetch(`/api/stats${filterParam}`),
        fetch('/api/supabase-status')
      ]);

      if (recRes.ok && statsRes.ok) {
        const recData = await recRes.json();
        const statsData = await statsRes.json();
        setRecords(recData.records || []);
        setStats(statsData);
      }
      if (spRes.ok) {
        const spData = await spRes.json();
        setSupabaseStatus(spData);
      }
    } catch (err) {
      console.error('Failed to fetch database data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeviceFilter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle test data submit
  const handleTestUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadResult(null);

    const payload = {
      device_id: deviceId.trim() || 'ESP32_MOOD_A01',
      emotion: emotion,
      heart_rate: Number(heartRate) || 78
    };

    try {
      let res: Response;
      let data: any;

      if (method === 'GET') {
        const targetUrl = `/data?msg=${encodeURIComponent(JSON.stringify(payload))}`;
        res = await fetch(targetUrl, { method: 'GET' });
        data = await res.json();

        if (res.ok && data.status === 'ok') {
          setUploadResult({
            success: true,
            message: `[GET /data] 上报成功！服务端返回 {"status":"ok"}，记录已插入数据库。`
          });
          fetchData();
        } else {
          setUploadResult({
            success: false,
            message: data.message || 'GET 上报失败，请检查请求参数'
          });
        }
      } else {
        res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();

        if (res.ok && data.success) {
          setUploadResult({
            success: true,
            message: `[POST /api/upload] 上报成功！数据已保存在数据库中 (ID: ${data.saved_record?.id || 'OK'})`
          });
          fetchData();
        } else {
          setUploadResult({
            success: false,
            message: data.error || 'POST 上报失败，请检查连通性'
          });
        }
      }
    } catch (err: any) {
      setUploadResult({
        success: false,
        message: '网络异常或接口不可达: ' + err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyGetLink = () => {
    navigator.clipboard.writeText(getFullUrl);
    setCopiedGetLink(true);
    setTimeout(() => setCopiedGetLink(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(uploadEndpoint);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };


  const handleResetData = async () => {
    if (confirm('确定要重置数据库为默认测试数据吗？')) {
      try {
        await fetch('/api/records', { method: 'DELETE' });
        fetchData();
      } catch (err) {
        console.error('Failed to reset records:', err);
      }
    }
  };

  // Find dominant emotion
  const dominantEmotion = stats?.pieChartData && stats.pieChartData.length > 0
    ? [...stats.pieChartData].sort((a, b) => b.count - a.count)[0]
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold mb-3 border border-indigo-100">
            <Database className="w-3.5 h-3.5" /> 数据库存储 & 扇形统计分析
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            数据上报 API 与心情分布图
          </h2>
          <p className="text-gray-500 mt-2 max-w-2xl text-base">
            ESP32 / 硬件设备通过 HTTP POST 上报 JSON 数据，系统自动存储至数据库并实时生成情绪分布扇形统计图。
          </p>
        </div>

        {/* API Link Boxes */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* GET /data Link Box */}
          <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-indigo-900/50">
            <div className="overflow-hidden">
              <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1 flex items-center gap-1">
                <Server className="w-3 h-3" /> GET /data 接口 (msg 查询参数)
              </div>
              <code className="text-xs font-mono text-emerald-300 block truncate max-w-xs">
                {getEndpoint}?msg=&#123;"device_id":"ESP32_MOOD_A01","emotion":"平静","heart_rate":78&#125;
              </code>
            </div>
            <button
              onClick={handleCopyGetLink}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0"
              title="复制 GET 链接"
            >
              {copiedGetLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copiedGetLink ? '已复制' : '复制 GET 链接'}
            </button>
          </div>

          {/* POST /api/upload Link Box */}
          <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-gray-800">
            <div className="overflow-hidden">
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 flex items-center gap-1">
                <Server className="w-3 h-3" /> POST /api/upload 接口
              </div>
              <code className="text-xs font-mono text-gray-200 block truncate max-w-xs">
                {uploadEndpoint}
              </code>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0 border border-gray-700"
              title="复制 POST 链接"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? '已复制' : '复制 POST 链接'}
            </button>
          </div>
        </div>

      </div>

      {/* Supabase Integration Banner */}
      {supabaseStatus && (
        <div className={`p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-sm ${
          supabaseStatus.connected
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : supabaseStatus.configured
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-start md:items-center gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
              supabaseStatus.connected
                ? 'bg-emerald-500 text-white'
                : supabaseStatus.configured
                ? 'bg-amber-500 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>外网 Supabase 独立数据库:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                  supabaseStatus.connected
                    ? 'bg-emerald-200/80 text-emerald-900'
                    : supabaseStatus.configured
                    ? 'bg-amber-200/80 text-amber-900'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {supabaseStatus.connected ? '⚡ 已连接成功' : supabaseStatus.configured ? '⚠️ 已配置未建表' : '未配置密钥'}
                </span>
                {supabaseStatus.tableUsed && (
                  <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    表: {supabaseStatus.tableUsed}
                  </span>
                )}
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                {supabaseStatus.message}
              </p>
            </div>
          </div>

          <div className="text-xs font-mono opacity-7 font-bold">
            {supabaseStatus.url ? `URL: ${supabaseStatus.url}` : '.env: VITE_SUPABASE_URL'}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
          }`}
        >
          <PieIcon className="w-4 h-4" /> 扇形统计图与汇总
        </button>
        <button
          onClick={() => setActiveTab('tester')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'tester'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
          }`}
        >
          <Send className="w-4 h-4" /> 在线模拟上传数据
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'code'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
          }`}
        >
          <Terminal className="w-4 h-4" /> ESP32 / cURL 上传代码
        </button>
      </div>

      {/* TAB 1: Analytics & Pie Chart */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <HardDrive className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">数据库总记录</div>
                <div className="text-3xl font-black text-gray-900 mt-1">
                  {stats?.totalRecords ?? records.length} <span className="text-xs text-gray-400 font-normal">条</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">平均心率</div>
                <div className="text-3xl font-black text-gray-900 mt-1">
                  {stats?.avgHeartRate ?? 75} <span className="text-xs text-gray-400 font-normal">BPM</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <PieIcon className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">最主要心情</div>
                <div className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
                  {dominantEmotion ? dominantEmotion.name : '平静'}
                  {dominantEmotion && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                      {dominantEmotion.percentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Server className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">上报设备数</div>
                <div className="text-3xl font-black text-gray-900 mt-1">
                  {stats?.deviceCount ?? 1} <span className="text-xs text-gray-400 font-normal">台</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Pie Chart & Emotion breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pie Chart Card */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <PieIcon className="w-6 h-6 text-indigo-600" />
                    数据库心情分布 (扇形统计图)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">实时根据上报存入数据库的心情标签统计分类占比</p>
                </div>

                {/* Device Filter */}
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                  <Filter className="w-4 h-4 text-gray-400 ml-2" />
                  <select
                    value={selectedDeviceFilter}
                    onChange={(e) => setSelectedDeviceFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-gray-700 outline-none pr-3 py-1 cursor-pointer"
                  >
                    <option value="ALL">全部设备</option>
                    {stats?.allDevices?.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Recharts Pie Chart */}
              <div className="h-80 w-full relative flex items-center justify-center">
                {stats?.pieChartData && stats.pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {stats.pieChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color === '#FFFFFF' ? '#e2e8f0' : entry.color} 
                            stroke={entry.color === '#FFFFFF' ? '#94a3b8' : 'none'}
                            strokeWidth={1.5}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as PieChartItem;
                            return (
                              <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 border border-gray-800">
                                <div className="font-bold flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                  {data.name}
                                </div>
                                <div>样本数量: <span className="font-bold text-indigo-300">{data.count} 次</span></div>
                                <div>总体占比: <span className="font-bold text-emerald-300">{data.percentage}%</span></div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        formatter={(value) => <span className="text-xs font-bold text-gray-700">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    暂无有效统计数据，请尝试上报一条心情。
                  </div>
                )}
              </div>
            </div>

            {/* Emotion List & Percentage Progress */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">心情占比明细</h3>
                <div className="space-y-4">
                  {stats?.pieChartData?.map((item) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="flex items-center gap-2 text-gray-800">
                          <span 
                            className="w-3 h-3 rounded-full border border-gray-200" 
                            style={{ backgroundColor: item.color }} 
                          />
                          {item.name}
                        </span>
                        <span className="text-gray-500">{item.count} 次 ({item.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.color === '#FFFFFF' ? '#94a3b8' : item.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>每8秒自动同步最新库数据</span>
                <button 
                  onClick={fetchData}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> 刷新
                </button>
              </div>
            </div>
          </div>

          {/* Records Data Table */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">数据库原始上报明细</h3>
                <p className="text-xs text-gray-400 mt-0.5">显示数据库保存的完整 HTTP POST 上报历史记录</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetData}
                  className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 重置默认测试库
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 rounded-l-2xl">时间</th>
                    <th className="p-4">设备 ID</th>
                    <th className="p-4">心情</th>
                    <th className="p-4">心率 (BPM)</th>
                    <th className="p-4 rounded-r-2xl text-right">记录 ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {records.length > 0 ? (
                      records.slice(0, 15).map((rec) => (
                        <motion.tr 
                          key={rec.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="p-4 font-mono text-xs text-gray-500">
                            {new Date(rec.created_at).toLocaleString()}
                          </td>
                          <td className="p-4 font-bold text-gray-900">
                            {rec.device_id}
                          </td>
                          <td className="p-4">
                            <span 
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-gray-200 shadow-2xl"
                              style={{ 
                                backgroundColor: rec.emotion_color || '#f1f5f9',
                                color: rec.emotion_color === '#FFFFFF' ? '#1e293b' : '#0f172a'
                              }}
                            >
                              <span 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: rec.emotion_color === '#FFFFFF' ? '#64748b' : rec.emotion_color }} 
                              />
                              {rec.emotion}
                            </span>
                          </td>
                          <td className="p-4 font-black text-indigo-600">
                            {rec.heart_rate} <span className="text-[10px] text-gray-400 font-normal">次/分</span>
                          </td>
                          <td className="p-4 text-right font-mono text-xs text-gray-400">
                            {rec.id}
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">
                          数据库目前暂无历史记录
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Online Upload Tester */}
      {activeTab === 'tester' && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-3xl mx-auto space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Send className="w-6 h-6 text-indigo-600" />
              在线模拟数据上报测试
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              可选择 HTTP GET (带 msg 查询参数) 或 HTTP POST 方式测试，上报数据后将存入数据库并实时更细统计图。
            </p>
          </div>

          {/* Request Method Switcher */}
          <div className="flex gap-4 p-1.5 bg-gray-100 rounded-2xl w-fit border border-gray-200">
            <button
              type="button"
              onClick={() => setMethod('GET')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                method === 'GET'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              HTTP GET 模式 (/data?msg=...)
            </button>
            <button
              type="button"
              onClick={() => setMethod('POST')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                method === 'POST'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              HTTP POST 模式 (/api/upload)
            </button>
          </div>

          <form onSubmit={handleTestUpload} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  设备 ID (device_id)
                </label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="例如 ESP32_MOOD_A01"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  心率数值 (heart_rate)
                </label>
                <input
                  type="number"
                  min={40}
                  max={200}
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                情绪状态 (emotion)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.keys(EMOTION_MAP).map((emoKey) => (
                  <button
                    key={emoKey}
                    type="button"
                    onClick={() => setEmotion(emoKey)}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                      emotion === emoKey
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: EMOTION_MAP[emoKey] }} 
                    />
                    {emoKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Payload / URL Preview */}
            {method === 'GET' ? (
              <div className="bg-gray-900 p-4 rounded-2xl text-xs font-mono text-emerald-300 border border-gray-800 space-y-1 overflow-x-auto">
                <div className="text-gray-500 text-[10px] uppercase font-bold">生成的 GET 请求完整 URL (包含 msg 查询参数):</div>
                <div className="break-all">{getFullUrl}</div>
              </div>
            ) : (
              <div className="bg-gray-900 p-4 rounded-2xl text-xs font-mono text-indigo-300 border border-gray-800 space-y-1">
                <div className="text-gray-500 text-[10px] uppercase font-bold">POST Body JSON 载荷:</div>
                <pre>{JSON.stringify({ device_id: deviceId, emotion: emotion, heart_rate: Number(heartRate) }, null, 2)}</pre>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              {isSubmitting ? '正在提交数据库...' : `通过 ${method} 方式立即上报存入数据库`}
            </button>
          </form>

          {/* Result Alert */}
          {uploadResult && (
            <div
              className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
                uploadResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {uploadResult.success ? <Check className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
              {uploadResult.message}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Code Snippets & Docs */}
      {activeTab === 'code' && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 max-w-4xl mx-auto">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Terminal className="w-6 h-6 text-indigo-600" />
              硬件与开发代码示例 (GET /data)
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              提供 ESP32 (Arduino C++) HTTP GET、cURL 及 Python 示例，演示如何通过 <code className="text-indigo-600 font-mono">msg</code> 参数上传心理数据。
            </p>
          </div>

          {/* ESP32 Arduino C++ HTTP GET Example */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span>ESP32 (Arduino C++) HTTP GET 上报示例:</span>
            </div>
            <div className="bg-gray-900 p-5 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto border border-gray-800 leading-relaxed">
              <pre>{`#include <WiFi.h>
#include <HTTPClient.h>

const char* baseUrl = "${getEndpoint}";

void sendMoodDataGet(String deviceId, String emotion, int heartRate) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // 1. 构造 JSON 文本
    String jsonPayload = "{\\"device_id\\":\\"" + deviceId + 
                         "\\",\\"emotion\\":\\"" + emotion + 
                         "\\",\\"heart_rate\\":" + String(heartRate) + "}";

    // 2. 拼接 GET /data?msg= 请求 URL
    String fullUrl = String(baseUrl) + "?msg=" + jsonPayload;

    http.begin(fullUrl);
    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      Serial.printf("HTTP 响应状态码: %d\\n", httpResponseCode);
      String response = http.getString();
      Serial.println(response); // 输出: {"status":"ok"}
    } else {
      Serial.printf("GET 请求失败: %s\\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }
}`}</pre>
            </div>
          </div>

          {/* cURL GET Example */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span>cURL HTTP GET 命令行示例:</span>
            </div>
            <div className="bg-gray-900 p-4 rounded-2xl text-xs font-mono text-gray-200 overflow-x-auto border border-gray-800">
              <code>{`curl -G "${getEndpoint}" --data-urlencode 'msg={"device_id":"ESP32_MOOD_A01","emotion":"平静","heart_rate":78}'`}</code>
            </div>
          </div>

          {/* Python Example */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-700">
              Python requests GET 脚本示例:
            </div>
            <div className="bg-gray-900 p-4 rounded-2xl text-xs font-mono text-indigo-300 overflow-x-auto border border-gray-800">
              <pre>{`import requests
import json

url = "${getEndpoint}"
msg_data = {
    "device_id": "ESP32_MOOD_A01",
    "emotion": "平静",
    "heart_rate": 78
}

response = requests.get(url, params={"msg": json.dumps(msg_data)})
print(response.json()) # {"status": "ok"}`}</pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
