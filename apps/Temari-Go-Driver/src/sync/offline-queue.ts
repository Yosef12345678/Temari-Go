import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'driver-offline-queue-v1';

export type QueuedAction =
  | { kind: 'manual_attendance'; payload: Record<string, unknown>; idempotencyKey: string }
  | { kind: 'job_transition'; payload: Record<string, unknown>; idempotencyKey: string };

export async function readQueue(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

export async function enqueue(action: Omit<QueuedAction, 'idempotencyKey'>) {
  const queue = await readQueue();
  const item: QueuedAction = {
    ...action,
    idempotencyKey: `${action.kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
  queue.push(item);
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
}

export async function replaceQueue(next: QueuedAction[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
