import { SyncEngine } from '../syncEngine';
import type { SyncTask } from '../syncEngine';

const makeExecutor = (calls: SyncTask[]) => async (task: SyncTask) => {
  calls.push(task);
};

const makeFailingExecutor = (failTimes: number) => {
  let count = 0;
  return async (_task: SyncTask) => {
    count += 1;
    if (count <= failTimes) throw new Error('network error');
  };
};

describe('SyncEngine', () => {
  it('온라인 상태에서 태스크를 즉시 실행한다', async () => {
    const calls: SyncTask[] = [];
    const engine = new SyncEngine(makeExecutor(calls));

    await engine.enqueue('UPSERT_TRIP', { id: 'trip-1' });

    expect(calls).toHaveLength(1);
    expect(calls[0].type).toBe('UPSERT_TRIP');
    expect(engine.getQueueLength()).toBe(0);
  });

  it('오프라인 상태에서 태스크를 큐에 보관한다', async () => {
    const calls: SyncTask[] = [];
    const engine = new SyncEngine(makeExecutor(calls));
    engine.setOnline(false);

    await engine.enqueue('UPSERT_TRIP', { id: 'trip-1' });
    await engine.enqueue('UPSERT_EVENT', { id: 'event-1' });

    expect(calls).toHaveLength(0);
    expect(engine.getQueueLength()).toBe(2);
  });

  it('온라인 전환 시 큐를 일괄 처리한다', async () => {
    const calls: SyncTask[] = [];
    const engine = new SyncEngine(makeExecutor(calls));
    engine.setOnline(false);

    await engine.enqueue('UPSERT_TRIP', { id: 'trip-1' });
    await engine.enqueue('DELETE_EVENT', { id: 'event-1' });

    expect(engine.getQueueLength()).toBe(2);
    expect(calls).toHaveLength(0);

    // 온라인 전환 후 flush 명시 실행
    await engine.setOnline(true);

    expect(calls).toHaveLength(2);
    expect(engine.getQueueLength()).toBe(0);
  });

  it('MAX_RETRIES 초과 시 태스크를 폐기한다', async () => {
    const engine = new SyncEngine(makeFailingExecutor(10));

    await engine.enqueue('UPSERT_TRIP', { id: 'trip-1' });
    await engine.flush();
    await engine.flush();
    await engine.flush();

    expect(engine.getQueueLength()).toBe(0);
  });
});
