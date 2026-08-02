export interface UploadDataPayload {
  device_id: string;
  emotion: string;
  heart_rate: number;
  timestamp?: string;
}

export interface MqttEmotionData {
  timestamp: string;
  heartRate: number;
  emotion: string;
  emotionColor: string;
  deviceId: string;
}

export interface DatabaseRecord {
  id: string;
  device_id: string;
  heart_rate: number;
  emotion: string;
  emotion_color: string;
  created_at: string;
}

export interface PieChartItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DatabaseStats {
  success: boolean;
  totalRecords: number;
  avgHeartRate: number;
  deviceCount: number;
  allDevices: string[];
  pieChartData: PieChartItem[];
}

export const EMOTION_MAP: Record<string, string> = {
  '平静': '#FFFFFF',
  '愉悦': '#FFB6C1',
  '兴奋': '#FFC0CB',
  '焦虑': '#00FF00',
  '愤怒': '#FF0000',
  '恐惧': '#800080',
  '悲伤': '#0000FF'
};
