import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TodoService {
  private readonly todos = new Map<string, Todo>();

  create(dto: CreateTodoDto): Todo {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: randomUUID(),
      title: dto.title,
      completed: dto.completed ?? false,
      createdAt: now,
      updatedAt: now,
    };
    this.todos.set(todo.id, todo);
    return { ...todo };
  }

  findAll(completed?: boolean): Todo[] {
    return [...this.todos.values()]
      .filter((todo) => completed === undefined || todo.completed === completed)
      .map((todo) => ({ ...todo }));
  }

  findOne(id: string): Todo {
    const todo = this.todos.get(id);
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return { ...todo };
  }

  update(id: string, dto: UpdateTodoDto): Todo {
    const todo = this.findOne(id);
    if (dto.title !== undefined) todo.title = dto.title;
    if (dto.completed !== undefined) todo.completed = dto.completed;
    todo.updatedAt = new Date().toISOString();
    this.todos.set(id, todo);
    return { ...todo };
  }

  remove(id: string): void {
    this.findOne(id);
    this.todos.delete(id);
  }
}
