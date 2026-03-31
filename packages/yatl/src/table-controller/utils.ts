export function getComparableValue(value: unknown) {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return value;
  } else if (typeof value === 'boolean') {
    return Number(value);
  } else if (value instanceof Date) {
    return value.getTime();
  } else if (value != null) {
    return String(value);
  }
  return value;
}
