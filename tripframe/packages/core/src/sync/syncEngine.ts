export type SyncTaskType =
  | 'UPSERT_TRIP'
  | 'DELETE_TRIP'
  | 'UPSERT_EVENT'
  | 'DELETE_EVENT';

export interface SyncTask {
  id: string;
  type: SyncTaskType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export type SyncExecutor = (task: SyncTask) => Promise<void>;

const MAX_RETRIES = 3;

export class SyncEngine {
  private queue: SyncTask[] = [];
  private online: boolean = true;
  private flushing: boolean = false;
  private readonly executor: SyncExecutor;

  constructor(executor: SyncExecutor) {
    this.executor = executor;
  }

  async setOnline(online: boolean): Promise<void> {
    this.online = online;
    if (online) {
      await this.flush();
    }
  }

  async enqueue(type: SyncTaskType, payload: Record<string, unknown>): Promise<void> {
    const task: SyncTask = {
      id: `${type}_${Date.now()}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.queue.push(task);
    if (this.online) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing) return;
    this.flushing = true;
    try {
      while (this.queue.length > 0 && this.online) {
        const task = this.queue[0];
        try {
          await this.executor(task);
          this.queue.shift();
        } catch {
          task.retryCount += 1;
          if (task.retryCount >= MAX_RETRIES) {
            console.error('[SyncEngine] 최대 재시도 초과, 태스크 폐기:', task.id);
            this.queue.shift();
          }
          break;
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isOnline(): boolean {
    return this.online;
  }
}
