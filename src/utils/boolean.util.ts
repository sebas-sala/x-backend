export function toBoolean(value: string | undefined | null): boolean {
  return !!(
    value &&
    value.trim() &&
    value !== 'undefined' &&
    value !== 'false' &&
    value !== 'null' &&
    value !== '0'
  );
}
