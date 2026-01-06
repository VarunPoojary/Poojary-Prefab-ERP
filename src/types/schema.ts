import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  role: 'admin' | 'manager';
  name: string;
  email: string;
  assigned_project_ids: string[];
}

export interface Project {
  id: string;
  name: string;
  location: string;
  budget_limit: number;
  assigned_manager_id: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
}

export interface Worker {
  id: string;
  name: string;
  skill: string;
  phone: string;
  payment_type: 'hourly' | 'daily' | 'contract';
  base_rate: number;
  current_balance: number;
}

export interface Transaction {
  id: string;
  project_id: string;
  type: 'expense' | 'income' | 'payout_advance' | 'payout_settlement';
  amount: number;
  category: string;
  proof_image_url?: string;
  timestamp: Timestamp;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  is_completed: boolean;
  completion_photo_url?: string;
}

export interface Attendance {
  id: string;
  date: Timestamp;
  worker_id: string;
  project_id: string;
  status: 'present' | 'absent' | 'leave';
  units_worked: number;
}
