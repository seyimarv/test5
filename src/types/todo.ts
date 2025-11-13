export type Priority = 'low' | 'medium' | 'high';
export type FilterStatus = 'all' | 'active' | 'completed';

export interface Todo {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
  order: number;
}

export interface TodoFilters {
  status: FilterStatus;
  priority: Priority | 'all';
  search: string;
}
