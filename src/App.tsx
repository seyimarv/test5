import { useState, useMemo } from 'react';
import { Todo, TodoFilters, Priority } from './types/todo';
import { useLocalStorage } from './hooks/use-local-storage';
import { AddTodo } from './components/AddTodo';
import { TodoList } from './components/TodoList';
import { FilterBar } from './components/FilterBar';
import { BulkActions } from './components/BulkActions';
import { TaskStats } from './components/TaskStats';
import { ListTodo } from 'lucide-react';

function App() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);
  const [filters, setFilters] = useState<TodoFilters>({
    status: 'all',
    priority: 'all',
    search: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const addTodo = (newTodo: {
    title: string;
    description: string;
    dueDate: string;
    priority: Priority;
  }) => {
    const todo: Todo = {
      id: crypto.randomUUID(),
      ...newTodo,
      completed: false,
      createdAt: new Date().toISOString(),
      order: todos.length,
    };
    setTodos([...todos, todo]);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const reorderTodos = (reorderedTodos: Todo[]) => {
    setTodos(reorderedTodos);
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleBulkComplete = () => {
    setTodos(
      todos.map((todo) =>
        selectedIds.has(todo.id) ? { ...todo, completed: true } : todo
      )
    );
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    setTodos(todos.filter((todo) => !selectedIds.has(todo.id)));
    setSelectedIds(new Set());
  };

  const filteredTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        // Status filter
        if (filters.status === 'active' && todo.completed) return false;
        if (filters.status === 'completed' && !todo.completed) return false;

        // Priority filter
        if (filters.priority !== 'all' && todo.priority !== filters.priority) return false;

        // Search filter
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return (
            todo.title.toLowerCase().includes(search) ||
            todo.description.toLowerCase().includes(search)
          );
        }

        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [todos, filters]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ListTodo className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Todo App</h1>
          </div>
          <p className="text-muted-foreground">
            Organize your tasks efficiently
          </p>
        </div>

        <div className="space-y-6">
          <TaskStats todos={todos} />

          <AddTodo onAdd={addTodo} />

          <FilterBar filters={filters} onFilterChange={setFilters} />

          <BulkActions
            selectedCount={selectedIds.size}
            onMarkComplete={handleBulkComplete}
            onDelete={handleBulkDelete}
            onClearSelection={() => setSelectedIds(new Set())}
          />

          <TodoList
            todos={filteredTodos}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            onReorder={reorderTodos}
            selectedIds={selectedIds}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
