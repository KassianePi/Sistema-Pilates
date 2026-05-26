export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_for_development_32_chars_long',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_jwt_refresh_secret_for_development_32_chars_long',
  PORT: parseInt(process.env.PORT || '3000'),
}

// In production, validate required variables
if (env.NODE_ENV === 'production') {
  const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']
  for (const env_var of requiredEnvs) {
    if (!process.env[env_var]) {
      throw new Error(`Mandatory environment variable: ${env_var}`)
    }
  }
}
