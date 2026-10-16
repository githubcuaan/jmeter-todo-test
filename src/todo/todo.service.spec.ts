import { NotFoundException } from '@nestjs/common';
import { TodoService } from './todo.service';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    service = new TodoService();
  });

  it('defaults completion to false and protects stored objects', () => {
    const todo = service.create({ title: 'Task' });
    expect(todo.completed).toBe(false);
    todo.title = 'Changed';
    expect(service.findOne(todo.id).title).toBe('Task');
    service.findAll()[0].completed = true;
    expect(service.findAll(false)).toHaveLength(1);
  });

  it('updates only provided fields and removes todos', () => {
    const todo = service.create({ title: 'Task', completed: true });
    expect(service.update(todo.id, { title: 'Updated' })).toMatchObject({
      title: 'Updated',
      completed: true,
    });
    service.remove(todo.id);
    expect(service.findAll()).toEqual([]);
    expect(() => service.findOne(todo.id)).toThrow(NotFoundException);
    expect(() => service.update(todo.id, { title: 'Missing' })).toThrow(
      NotFoundException,
    );
    expect(() => service.remove(todo.id)).toThrow(NotFoundException);
  });
});
