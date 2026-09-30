export const DEFAULT_DEADLINE_DAYS = 3;

export function getDeadline(createdAt: Date, deadlineDays: number | null) {
  const days = deadlineDays ?? DEFAULT_DEADLINE_DAYS;
  return new Date(createdAt.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isPollOpen(poll: {
  active: boolean;
  createdAt: Date;
  deadlineDays: number | null;
}) {
  return poll.active && getDeadline(poll.createdAt, poll.deadlineDays) > new Date();
}