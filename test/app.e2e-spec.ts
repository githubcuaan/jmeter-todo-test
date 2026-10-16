import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Todo } from './../src/todo/todo.service';

describe('Todos API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('creates, lists, reads, updates, filters, and deletes a todo', async () => {
    const server = app.getHttpServer();
    await request(server).get('/todos').expect(200).expect([]);
    const created = await request(server)
      .post('/todos')
      .send({ title: '  Buy milk  ' })
      .expect(201);
    const todo = created.body as Todo;
    expect(todo).toMatchObject({
      title: 'Buy milk',
      completed: false,
    });
    expect(typeof todo.id).toBe('string');
    expect(Number.isNaN(Date.parse(todo.createdAt))).toBe(false);
    expect(todo.updatedAt).toBe(todo.createdAt);
    await request(server).get(`/todos/${todo.id}`).expect(200).expect(todo);
    await request(server)
      .get('/todos?completed=false')
      .expect(200)
      .expect([todo]);
    await request(server)
      .patch(`/todos/${todo.id}`)
      .send({ completed: true })
      .expect(200)
      .expect(({ body }: { body: { completed: boolean; title: string } }) => {
        expect(body.completed).toBe(true);
        expect(body.title).toBe('Buy milk');
      });
    await request(server).get('/todos?completed=false').expect(200).expect([]);
    await request(server)
      .patch(`/todos/${todo.id}`)
      .send({ title: 'Buy bread', completed: false })
      .expect(200);
    await request(server).delete(`/todos/${todo.id}`).expect(204).expect('');
    await request(server).get(`/todos/${todo.id}`).expect(404);
    await request(server).patch(`/todos/${todo.id}`).send({}).expect(404);
    await request(server).delete(`/todos/${todo.id}`).expect(404);
  });

  it.each([
    {},
    { title: '' },
    { title: '   ' },
    { title: null },
    { title: 42 },
    { title: 'a'.repeat(201) },
    { title: 'Task', completed: 'false' },
    { title: 'Task', completed: null },
    { title: 'Task', extra: true },
  ])('rejects invalid create payload %j', async (payload) => {
    await request(app.getHttpServer()).post('/todos').send(payload).expect(400);
  });

  it('rejects invalid updates, IDs, and filters', async () => {
    const server = app.getHttpServer();
    const response = await request(server)
      .post('/todos')
      .send({ title: 'Task', completed: true })
      .expect(201);
    const { id } = response.body as { id: string };
    for (const payload of [
      { title: null },
      { title: ' ' },
      { completed: null },
      { completed: 1 },
      { extra: true },
    ]) {
      await request(server).patch(`/todos/${id}`).send(payload).expect(400);
    }
    await request(server).get('/todos/not-a-uuid').expect(400);
    await request(server).get('/todos?completed=invalid').expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
