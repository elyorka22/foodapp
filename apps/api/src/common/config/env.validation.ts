export function validateEnv(): { ok: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    errors.push('JWT_SECRET must be at least 16 characters');
  }
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_REFRESH_SECRET) {
      warnings.push('JWT_REFRESH_SECRET not set — using JWT_SECRET fallback recommended');
    }
    if (!process.env.CORS_ORIGINS) {
      warnings.push('CORS_ORIGINS not set — API may reject browser requests');
    }
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      warnings.push('TELEGRAM_BOT_TOKEN not set — ops alerts disabled');
    }
  }

  return { ok: errors.length === 0, warnings, errors };
}
