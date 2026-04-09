export function buildFutureDate(daysAhead, hour, minute, baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, minute, 0, 0);
  return normaliseLocalDateTime(date);
}

export function normaliseLocalDateTime(value, fallback = null) {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback ?? buildFutureDate(1, 10, 0, new Date());
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getWeekdayIndex(value) {
  const date = new Date(value);
  return (date.getDay() + 6) % 7;
}

export function getStartOfWeek(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  const dayIndex = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - dayIndex);
  return date;
}

export function getStartOfMonth(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  return date;
}

export function addDays(value, amount) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function setDateOnWeekday(value, weekStart, weekdayIndex) {
  const original = new Date(value);
  const target = addDays(getStartOfWeek(weekStart), weekdayIndex);
  target.setHours(original.getHours(), original.getMinutes(), 0, 0);
  return normaliseLocalDateTime(target);
}

export function setDateKeepingTime(value, dayValue) {
  const original = new Date(value);
  const target = dayValue instanceof Date ? new Date(dayValue) : new Date(dayValue);
  target.setHours(original.getHours(), original.getMinutes(), 0, 0);
  return normaliseLocalDateTime(target);
}

export function isSameLocalDay(left, right) {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return leftDate.getFullYear() === rightDate.getFullYear()
    && leftDate.getMonth() === rightDate.getMonth()
    && leftDate.getDate() === rightDate.getDate();
}

export function isSameLocalMonth(left, right) {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return leftDate.getFullYear() === rightDate.getFullYear()
    && leftDate.getMonth() === rightDate.getMonth();
}

export function differenceInMinutes(left, right) {
  return Math.round((new Date(left).getTime() - new Date(right).getTime()) / 60000);
}

function pad(value) {
  return String(value).padStart(2, '0');
}
