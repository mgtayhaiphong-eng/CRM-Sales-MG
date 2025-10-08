
// FIX: Moved Role enum from App.tsx to here to break the circular dependency.
export enum Role {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
  name: string;
}

export interface Interaction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'test_drive' | 'quotation' | 'other';
  date: number;
  notes: string;
  duration: number;
  outcome: 'positive' | 'neutral' | 'negative';
  userId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  carModel?: string;
  source?: string;
  statusId: string;
  city?: string;
  notes?: string;
  salesValue: number;
  tier: 'HOT' | 'WARM' | 'COLD' | 'LOST';
  createdDate: number;
  lastContactDate: number;
  interactions: Interaction[];
  userId: string; // ID of the user who created/owns this customer
}

export interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  type: 'pipeline' | 'win' | 'delivered' | 'lostsale';
}

export interface CarModel {
  id: string;
  name: string;
}

export interface CustomerSource {
  id: string;
  name: string;
}

export interface Reminder {
  id: string;
  customerId: string; // Link to customer
  userId: string; // Link to user who owns the reminder
  title: string;
  description: string;
  dueDate: number;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface SalesGoal {
    // Define structure later if needed
}

export interface CrmData {
  customers: Customer[];
  statuses: Status[];
  carModels: CarModel[];
  customerSources: CustomerSource[];
  reminders: Reminder[];
  salesGoals: SalesGoal[];
}