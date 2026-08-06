import React from 'react';
import { motion } from 'motion/react';
import { Heart, Zap, BarChart3, Shield, ArrowRight, Sparkles, Layout, Eye, Activity, Cpu, Database, Share2, Code } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="pt-40 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-indigo-400/5 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-full border border-indigo-100">
              <Cpu className="w-4 h-4" />
              <span>硬件驱动 · 实时情绪追踪</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-8 tracking-tight leading-[1.1]">
              用代码记录<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500">
                每一次心跳波动
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed font-medium">
              心情光语站：基于 ESP32 与高精度心率传感器的智能健康系统。<br className="hidden md:block" />
              每5秒自动采样，24路全彩 LED 实时映射，学生情绪趋势实时监听。
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-2 group"
              >
                查看核心功能
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Device Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-24 relative max-w-5xl mx-auto"
          >
            <div className="relative aspect-[16/9] bg-gray-900 rounded-[3rem] shadow-3xl overflow-hidden border-[12px] border-white ring-1 ring-gray-100 p-12">
               {/* NeoPixel Ring Simulation */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-80 h-80 rounded-full border-[10px] border-gray-800 flex items-center justify-center">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          opacity: [0.3, 1, 0.3],
                          scale: [1, 1.1, 1],
                          backgroundColor: ['#ffffff', '#ffb6c1', '#ffffff']
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity, 
                          delay: i * 0.05 
                        }}
                        className="absolute w-4 h-4 rounded-full blur-[2px] shadow-lg"
                        style={{
                          transform: `rotate(${i * 15}deg) translateY(-145px)`
                        }}
                      />
                    ))}
                    <div className="text-center z-10">
                      <Heart className="w-16 h-16 text-rose-500 mx-auto mb-2 animate-pulse fill-rose-500/20" />
                      <div className="text-4xl font-black text-white">75</div>
                      <div className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">BASELINE BPM</div>
                    </div>
                  </div>
               </div>
               
               {/* Floating Overlay Status */}
               <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-left">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">系统状态</div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                       <span className="text-white font-bold">WiFi 已连接: SparkMinds_IOT</span>
                    </div>
                  </div>
                  <div className="bg-indigo-600 px-6 py-4 rounded-2xl shadow-xl text-left">
                    <div className="text-[10px] font-bold text-indigo-200 uppercase mb-1">心情日记</div>
                    <div className="text-white font-black text-xl">已记录 432 条</div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Code / Algorithm Preview Section */}
      <section className="py-24 bg-gray-900 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div>
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">更精细的情绪分级算法</h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                不同于简单的三段式判断，我们基于基准心率（BASELINE_HR）的偏移量，
                细化了七个维度的情绪反馈模型。每一段 5 秒的自动采样都能精准映射出最真实的心境。
              </p>
              <ul className="space-y-4">
                {[
                  { label: "平静", diff: "±10 BPM", color: "bg-white" },
                  { label: "焦虑", diff: "+10~20 BPM", color: "bg-green-500" },
                  { label: "恐惧", diff: ">30 BPM", color: "bg-purple-600" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-gray-300">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="font-bold w-16">{item.label}</span>
                    <span className="text-gray-500">心率偏移值: {item.diff}</span>
                  </li>
                ))}
              </ul>
           </div>
           <div className="bg-[#0f1117] p-8 rounded-3xl border border-white/5 shadow-2xl relative">
              <div className="absolute top-4 right-6 text-indigo-400/50 font-mono text-xs">firmware.ino</div>
              <pre className="text-xs md:text-sm font-mono text-indigo-100/80 overflow-auto">
                <code>{`uint32_t getEmotionColor(int hr) {
  if (hr <= 0) return COLOR_YELLOW;
  int diff = hr - 75;
  if (diff >= -10 && diff <= 10) return COLOR_WHITE;
  if (diff > 10 && diff <= 20) return COLOR_GREEN;
  if (diff > 20 && diff <= 30) return COLOR_RED;
  if (diff > 30) return COLOR_PURPLE;
  return COLOR_BLUE;
}

// 自动采样逻辑
if (millis() - lastRecordTime >= 5000) {
  autoAddMoodRecord();
}`}</code>
              </pre>
           </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">全栈软硬一体方案</h2>
            <p className="text-xl text-gray-500">从底层传感器采样到云端数据导出的完整闭环</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: '硬件实时同步',
                desc: '集成 24 路 NeoPixel 灯环，通过 Serial 硬件级同步心率，让抽象的心跳化为空间的色彩。',
                icon: Cpu,
                color: 'bg-indigo-50 text-indigo-600'
              },
              {
                title: '5秒自动采样',
                desc: '无需手动干预，系统每 5 秒自动上传心率快照，构建长达 500 条的连续情绪流，支持 NTP 时间校准。',
                icon: Database,
                color: 'bg-emerald-50 text-emerald-600'
              },
              {
                title: '多维数据导出',
                desc: '内置 WebServer 仪表盘，支持按“今日、本周、全部”维度筛选，并可一键导出 CSV 专业报表。',
                icon: Share2,
                color: 'bg-rose-50 text-rose-600'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-[2.5rem] bg-gray-50 border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-base">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Details Table (High-end addition) */}
      <section className="py-32 bg-[#fafafa]">
         <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">硬件配置与引脚定义</h2>
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-widest">模块</th>
                        <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-widest">配置</th>
                        <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-widest">引脚 / 定义</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {[
                        { module: "主控单元", config: "ESP32 Series", pin: "WiFi / WebServer (80)" },
                        { module: "心率传感器", config: "UART 38400bps", pin: "RX: 8 / TX: 9" },
                        { module: "交互反馈", config: "24-Bit NeoPixel", pin: "IO: 3" },
                        { module: "采样间隔", config: "MoodRecord (500 MAX)", pin: "Interval: 5000ms" },
                        { module: "触摸分级", config: "T2 / T5 / HG", pin: "IO: 2, 5, 4" },
                     ].map((row, i) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                           <td className="px-8 py-6 font-bold text-gray-900">{row.module}</td>
                           <td className="px-8 py-6 text-gray-600">{row.config}</td>
                           <td className="px-8 py-6 font-mono text-indigo-600 text-sm">{row.pin}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-32 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-indigo-600 rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 blur-[100px] rounded-full" />
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8">开启专业级<br />情绪量化监测</h2>
            <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
              不仅仅是灯光，更是每一份真实的心理快照。立即获取完整硬件清单与烧录指南。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl">
                下载原理图 (PDF)
              </button>
              <button className="px-10 py-5 bg-indigo-900 text-white rounded-2xl font-bold text-lg hover:bg-indigo-950 transition-all">
                加入开发者群
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
