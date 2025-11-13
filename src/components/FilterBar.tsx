import { TodoFilters, FilterStatus, Priority } from '../types/todo';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search } from 'lucide-react';

interface FilterBarProps {
  filters: TodoFilters;
  onFilterChange: (filters: TodoFilters) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorityOptions: { value: Priority | 'all'; label: string }[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {statusOptions.map((option) => (
            <Badge
              key={option.value}
              variant={filters.status === option.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() =>
                onFilterChange({ ...filters, status: option.value })
              }
            >
              {option.label}
            </Badge>
          ))}
        </div>

        <div className="w-px bg-border" />

        <div className="flex gap-1">
          {priorityOptions.map((option) => (
            <Badge
              key={option.value}
              variant={filters.priority === option.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() =>
                onFilterChange({ ...filters, priority: option.value })
              }
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
