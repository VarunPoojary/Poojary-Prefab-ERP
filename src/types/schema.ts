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
  name:string;
  location: string;
  budget_limit: number;
  order_value: number;
  assigned_manager_id: string;
  status: 'active' | 'completed';
  utilised_budget?: number;
  received_amount?: number;
}

export interface Worker {
  id: string;
  name: string;
  skill: string;
  phone: string;
  payment_type: 'hourly' | 'daily' | 'monthly';
  base_rate: number;
  current_balance: number;
}

export interface Transaction {
  id: string;
  project_id?: string;
  type: 'expense' | 'income' | 'payout_advance' | 'payout_settlement' | 'salary_settlement';
  amount: number;
  category: string;
  description: string;
  proof_image_url?: string;
  worker_id?: string;
  timestamp: Timestamp | Date | string;
  created_by: string;
  status: 'unapproved' | 'approved' | 'rejected';
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  completion_photo_url: string;
  expected_completion_date?: string;
}

export interface Attendance {
  id: string;
  date: Timestamp;
  worker_id: string;
  worker_name: string;
  project_id: string;
  project_name?: string;
  status: 'present' | 'absent';
  units_worked: number;
}

export interface SalaryPayout {
  id: string;
  payout_date: Timestamp;
  total_amount_paid: number;
  paid_by: string;
  paid_workers: {
    worker_id: string;
    worker_name: string;
    amount_paid: number;
  }[];
}

    
