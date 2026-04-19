export type EmotionType = 'Calm' | 'Joy' | 'Excited' | 'Anxious' | 'Anger' | 'Fear' | 'Sad' | 'Wait';

export interface HeartRateRecord {
  id: string;
  user_id: string;
  heart_rate: number;
  emotion: EmotionType;
  created_at: string;
  class_id?: string;
}

export const EMOTION_CONFIG: Record<EmotionType, { color: string; label: string; description: string }> = {
  Calm: { color: '#FFFFFF', label: '平静', description: '心率平稳，情绪安定' },
  Joy: { color: '#FFB6C1', label: '愉悦', description: '心率轻快，心情舒畅' },
  Excited: { color: '#FFC0CB', label: '兴奋', description: '心率略高，充满活力' },
  Anxious: { color: '#00FF00', label: '焦虑', description: '心率波动，感到不安' },
  Anger: { color: '#FF0000', label: '愤怒', description: '心率急促，情绪波动强烈' },
  Fear: { color: '#800080', label: '恐惧', description: '心率剧变，处于极度紧张' },
  Sad: { color: '#0000FF', label: '悲伤', description: '心率低迷，情绪沉重' },
  Wait: { color: '#FFFF00', label: '等待', description: '正在获取心率数据...' },
};
