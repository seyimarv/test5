import { Todo } from '../types/todo';
import { Card, CardContent } from './ui/card';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface TaskStatsProps {
  todos: Todo[];
}

export function TaskStats({ todos }: TaskStatsProps) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;
  const overdue = todos.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  const stats = [
    {
      label: 'Total Tasks',
      value: total,
      icon: Circle,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Active',
      value: active,
      icon: Circle,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
