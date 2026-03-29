import React from 'react';
import { motion } from 'motion/react';
import { Heart, Zap, BarChart3, Shield, ArrowRight, Sparkles, Layout, Eye, Activity } from 'lucide-react';

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
              <Sparkles className="w-4 h-4" />
              <span>2026 校园心理健康创新方案</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-8 tracking-tight leading-[1.1]">
              让情绪<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500">
                拥有色彩与语言
              </span>
            </h1>
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed font-medium">
              情绪光语站：结合生物反馈技术与艺术可视化，<br className="hidden md:block" />
              为校园提供实时、科学、温暖的情绪认知与群体心理监测方案。
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center gap-2 group"
              >
                了解核心功能
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-10 py-5 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold text-lg hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                查看演示视频
              </button>
            </div>
          </motion.div>

          {/* Product Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-24 relative max-w-5xl mx-auto"
          >
            <div className="aspect-[16/9] bg-gradient-to-br from-gray-900 to-indigo-900 rounded-[3rem] shadow-3xl overflow-hidden border-[12px] border-white ring-1 ring-gray-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
                <div className="relative z-10 text-center">
                  <Heart className="w-20 h-20 text-indigo-400 mx-auto mb-4 animate-bounce" />
                  <div className="text-white/40 font-mono text-sm tracking-widest uppercase">系统初始化中...</div>
                </div>
              </div>
              {/* Decorative UI elements */}
              <div className="absolute top-8 left-8 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
            </div>
            {/* Floating Badges */}
            <div className="absolute -top-6 -right-6 bg-white p-6 rounded-3xl shadow-xl border border-gray-50 hidden lg:block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">实时心率</div>
                  <div className="text-2xl font-black text-gray-900">72 BPM</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">四大核心功能</h2>
            <p className="text-xl text-gray-500">全方位守护学生心理健康，助力智慧校园建设</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: '实时心率监测',
                desc: '采用高精度生物传感器，毫秒级捕捉心率变异性（HRV），为情绪判断提供坚实的生理数据基础。',
                icon: Heart,
                color: 'bg-rose-50 text-rose-600',
                image: 'https://picsum.photos/seed/heart/800/600'
              },
              {
                title: '情绪智能判断',
                desc: '内置自研情绪识别算法，自动分析心率特征，精准识别“平静、兴奋、焦虑、压力”等多种心理状态。',
                icon: Zap,
                color: 'bg-amber-50 text-amber-600',
                image: 'https://picsum.photos/seed/brain/800/600'
              },
              {
                title: '色彩可视化反馈',
                desc: '将抽象情绪转化为流动的LED光语。通过直观的色彩语言，帮助学生建立情绪认知，实现即时心理调节。',
                icon: Eye,
                color: 'bg-indigo-50 text-indigo-600',
                image: 'https://picsum.photos/seed/light/800/600'
              },
              {
                title: '班级群体分析',
                desc: '自动生成匿名化“情绪热力图”与趋势曲线。在严格保护隐私的前提下，协助教师掌握班级整体心理节奏。',
                icon: BarChart3,
                color: 'bg-emerald-50 text-emerald-600',
                image: 'https://picsum.photos/seed/chart/800/600'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-10 rounded-[3rem] bg-gray-50 border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-sm`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-lg mb-8">{feature.desc}</p>
                <div className="rounded-2xl overflow-hidden aspect-video relative">
                  <img src={feature.image} alt={feature.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-transparent transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-32 bg-indigo-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8">简单三步，<br />开启情绪认知之旅</h2>
              <div className="space-y-10">
                {[
                  { step: '01', title: '佩戴与同步', desc: '学生佩戴轻便的传感器设备，系统自动通过蓝牙建立连接。' },
                  { step: '02', title: '实时感知', desc: '系统实时分析生理数据，光语站根据情绪状态变换灯光色彩。' },
                  { step: '03', title: '数据沉淀', desc: '自动生成个人情绪日记与班级匿名报告，提供科学的心理参考。' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-4xl font-black opacity-30">{item.step}</div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-indigo-100 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/10 rounded-[4rem] backdrop-blur-3xl border border-white/20 p-12 flex items-center justify-center">
                <Layout className="w-full h-full text-white/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-48 h-48 bg-white rounded-full shadow-2xl flex items-center justify-center"
                  >
                    <Heart className="w-20 h-20 text-indigo-600 fill-current" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-10">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 mb-8">隐私安全是我们的底线</h2>
          <p className="text-xl text-gray-500 leading-relaxed mb-12">
            我们深知心理数据的敏感性。情绪光语站采用端到端加密技术，
            所有生成的群体报告均经过严格的匿名化处理，确保不暴露任何具体学生的个人身份与隐私。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['匿名化处理', '本地加密存储', '符合教育安全标准'].map((item, i) => (
              <div key={i} className="px-6 py-4 bg-gray-50 rounded-2xl font-bold text-gray-700 border border-gray-100">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-32 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-[4rem] p-12 md:p-20 border border-gray-100 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full" />
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8">准备好为您的校园<br />注入情绪色彩了吗？</h2>
            <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
              联系我们的教育专家，获取定制化的校园心理健康解决方案。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <input 
                type="email" 
                placeholder="输入您的邮箱地址" 
                className="px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none w-full md:w-80 transition-all font-medium"
              />
              <button className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                提交申请
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
