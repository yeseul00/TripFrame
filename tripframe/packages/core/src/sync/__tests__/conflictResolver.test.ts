import { resolveConflict } from '../conflictResolver';

const makeRecord = (updated_at: string) => ({ id: '1', updated_at });

describe('resolveConflict (Last Write Wins)', () => {
  it('로컬이 더 최신이면 로컬을 반환한다', () => {
    const local = makeRecord('2026-03-28T10:00:00Z');
    const remote = makeRecord('2026-03-28T09:00:00Z');

    expect(resolveConflict(local, remote)).toBe(local);
  });

  it('원격이 더 최신이면 원격을 반환한다', () => {
    const local = makeRecord('2026-03-28T09:00:00Z');
    const remote = makeRecord('2026-03-28T10:00:00Z');

    expect(resolveConflict(local, remote)).toBe(remote);
  });

  it('타임스탬프가 같으면 로컬을 반환한다', () => {
    const ts = '2026-03-28T10:00:00Z';
    const local = makeRecord(ts);
    const remote = makeRecord(ts);

    expect(resolveConflict(local, remote)).toBe(local);
  });
});
