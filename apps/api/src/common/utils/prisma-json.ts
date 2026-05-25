import { Prisma } from '@prisma/client';

/** Narrow values to Prisma 6 JSON input type without weakening global types. */
export function isInputJsonValue(value: unknown): value is Prisma.InputJsonValue {
  if (value === null) return true;
  const kind = typeof value;
  if (kind === 'string' || kind === 'number' || kind === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isInputJsonValue);
  if (kind === 'object') {
    return Object.values(value as Record<string, unknown>).every(isInputJsonValue);
  }
  return false;
}

export function toInputJsonValue(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (!isInputJsonValue(value)) {
    throw new Error('Value must be JSON-serializable for Prisma');
  }
  return value;
}

export function toInputJsonValueFromUnknown(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (!isInputJsonValue(value)) {
    throw new Error('Value must be JSON-serializable for Prisma');
  }
  return value;
}
