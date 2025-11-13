import { useState } from 'react';
import { Todo } from '../types/todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onDelete: (id: string) => void;
  onReorder: (todos: Todo[]) => void;
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
}

export function TodoList({
  todos,
  onUpdate,
  onDelete,
  onReorder,
  selectedIds,
  onSelect,
}: TodoListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newTodos = [...todos];
      const [draggedItem] = newTodos.splice(draggedIndex, 1);
      newTodos.splice(dragOverIndex, 0, draggedItem);

      // Update order property
      const reorderedTodos = newTodos.map((todo, index) => ({
        ...todo,
        order: index,
      }));

      onReorder(reorderedTodos);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No tasks found</p>
        <p className="text-sm mt-2">Add a new task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todos.map((todo, index) => (
        <div
          key={todo.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`transition-all ${
            dragOverIndex === index && draggedIndex !== index
              ? 'border-t-2 border-primary pt-2'
              : ''
          } ${draggedIndex === index ? 'opacity-50' : ''}`}
        >
          <TodoItem
            todo={todo}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isSelected={selectedIds.has(todo.id)}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}
