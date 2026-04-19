/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MoodPiano } from './components/MoodPiano';
import { Heart } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />

      <main>
        <Hero />
        <section id="piano" className="bg-white">
          <MoodPiano />
        </section>
      </main>

      <footer className="py-16 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                情绪光语站
              </span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-gray-400">
              <a href="#" className="hover:text-indigo-600 transition-colors">隐私政策</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">服务条款</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">关于我们</a>
            </div>
            <p className="text-gray-400 text-sm">
              © 2026 情绪光语站 (Emotion Light Station). All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
