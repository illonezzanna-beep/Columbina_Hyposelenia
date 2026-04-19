import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'motion/react';
import { Piano as PianoIcon, Music, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';

// Piano keys mapping for 2 octaves
const KEYS = [
  { note: 'C4', label: 'C', key: 'a', type: 'white' },
  { note: 'C#4', label: 'C#', key: 'w', type: 'black' },
  { note: 'D4', label: 'D', key: 's', type: 'white' },
  { note: 'D#4', label: 'D#', key: 'e', type: 'black' },
  { note: 'E4', label: 'E', key: 'd', type: 'white' },
  { note: 'F4', label: 'F', key: 'f', type: 'white' },
  { note: 'F#4', label: 'F#', key: 't', type: 'black' },
  { note: 'G4', label: 'G', key: 'g', type: 'white' },
  { note: 'G#4', label: 'G#', key: 'y', type: 'black' },
  { note: 'A4', label: 'A', key: 'h', type: 'white' },
  { note: 'A#4', label: 'A#', key: 'u', type: 'black' },
  { note: 'B4', label: 'B', key: 'j', type: 'white' },
  { note: 'C5', label: 'C', key: 'k', type: 'white' },
  { note: 'C#5', label: 'C#', key: 'o', type: 'black' },
  { note: 'D5', label: 'D', key: 'l', type: 'white' },
  { note: 'D#5', label: 'D#', key: 'p', type: 'black' },
  { note: 'E5', label: 'E', key: ';', type: 'white' },
];

const MOODS = [
  { id: 'calm', label: '宁静', color: '#6366f1', type: 'sine', reverb: 0.8 },
  { id: 'joy', label: '欢乐', color: '#f59e0b', type: 'triangle', reverb: 0.4 },
  { id: 'energy', label: '活力', color: '#10b981', type: 'square', reverb: 0.2 },
  { id: 'dreamy', label: '梦幻', color: '#a855f7', type: 'sawtooth', reverb: 0.9 },
];

export const MoodPiano: React.FC = () => {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);
  const [currentMood, setCurrentMood] = useState(MOODS[0]);
  const [muted, setMuted] = useState(false);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);

  useEffect(() => {
    // Initialize synth
    const reverb = new Tone.Reverb(currentMood.reverb).toDestination();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: currentMood.type as any },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 },
    }).connect(reverb);
    
    synthRef.current = synth;
    reverbRef.current = reverb;

    return () => {
      synth.dispose();
      reverb.dispose();
    };
  }, [currentMood]);

  const playNote = useCallback(async (note: string) => {
    if (!isReady) {
      await Tone.start();
      setIsReady(true);
    }
    if (muted) return;
    
    synthRef.current?.triggerAttack(note);
    setActiveNotes(prev => new Set(prev).add(note));
  }, [isReady, muted]);

  const stopNote = useCallback((note: string) => {
    synthRef.current?.triggerRelease(note);
    setActiveNotes(prev => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const mapping = KEYS.find(k => k.key === e.key.toLowerCase());
      if (mapping) playNote(mapping.note);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const mapping = KEYS.find(k => k.key === e.key.toLowerCase());
      if (mapping) stopNote(mapping.note);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playNote, stopNote]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-full border border-indigo-100"
        >
          <Music className="w-4 h-4" />
          <span>情绪共鸣钢琴</span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">用音符表达你的心境</h2>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          每一个音符都是一种色彩。选择你的当前心境，让音乐成为情绪的出口。
        </p>
      </div>

      <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-2xl shadow-indigo-100/30">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-8 mb-12">
          <div className="flex gap-4">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setCurrentMood(mood)}
                className={cn(
                  "px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2",
                  currentMood.id === mood.id 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                )}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: mood.color }} 
                />
                {mood.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setMuted(!muted)}
            className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all hover:bg-white hover:shadow-lg border border-transparent hover:border-indigo-100"
          >
            {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>

        {/* Piano Visualizer Overlay */}
        <div className="relative h-64 mb-8 rounded-[2rem] overflow-hidden bg-gray-900 flex items-center justify-center">
          <AnimatePresence>
            {activeNotes.size > 0 ? (
              Array.from(activeNotes).map((note) => (
                <motion.div
                  key={note}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.6, scale: 1.5 }}
                  exit={{ opacity: 0, scale: 2 }}
                  className="absolute w-40 h-40 rounded-full blur-3xl transition-colors"
                  style={{ backgroundColor: currentMood.color }}
                />
              ))
            ) : (
              <div className="text-gray-600 font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                弹奏键盘或点击琴键开启音乐体验 (键盘 ASDF...)
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Piano Keys */}
        <div className="relative flex justify-center h-80 select-none">
          {KEYS.map((key, i) => (
            <motion.div
              key={`${key.note}-${i}`}
              onMouseDown={() => playNote(key.note)}
              onMouseUp={() => stopNote(key.note)}
              onMouseLeave={() => stopNote(key.note)}
              onTouchStart={(e) => { e.preventDefault(); playNote(key.note); }}
              onTouchEnd={() => stopNote(key.note)}
              className={cn(
                "relative transition-all duration-75 flex items-end justify-center pb-8 font-bold border rounded-b-2xl cursor-pointer",
                key.type === 'white' 
                  ? "w-14 h-full bg-white text-gray-300 border-gray-100 z-10 hover:bg-gray-50" 
                  : "w-10 h-3/5 bg-gray-900 text-gray-600 border-transparent -mx-5 z-20 hover:bg-gray-800",
                activeNotes.has(key.note) && (key.type === 'white' ? "bg-indigo-50 !border-indigo-200 text-indigo-400 translate-y-1 shadow-inner" : "bg-indigo-400 !z-30 translate-y-1 shadow-xl")
              )}
            >
              <div className="text-[10px] uppercase tracking-tighter opacity-50">
                {key.key}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
