export type EmotionType = 'Calm' | 'Excited' | 'Anxious' | 'Stressed' | 'Happy';

export interface HeartRateRecord {
  id: string;
  user_id: string;
  heart_rate: number;
  emotion: EmotionType;
  created_at: string;
  class_id?: string;
}

export interface EmotionStats {
  emotion: EmotionType;
  count: number;
  color: string;
}

export const EMOTION_CONFIG: Record<EmotionType, { color: string; label: string; description: string }> = {
  Calm: { color: '#4ADE80', label: '平静', description: '心率平稳，情绪安定' },
  Excited: { color: '#FACC15', label: '兴奋', description: '心率略高，充满活力' },
  Anxious: { color: '#FB923C', label: '焦虑', description: '心率波动，感到不安' },
  Stressed: { color: '#F87171', label: '压力', description: '心率持续偏高，压力较大' },
  Happy: { color: '#60A5FA', label: '愉悦', description: '心率轻快，心情舒畅' },
};
