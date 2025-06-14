// 环境变量配置和验证

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string[];
  DATABASE_PATH: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  CACHE_TTL: number;
  MAX_UPLOAD_SIZE: number;
}

// 默认配置
const defaultConfig: EnvConfig = {
  NODE_ENV: 'development',
  PORT: 3000,
  JWT_SECRET: 'your-secret-key-change-in-production',
  ALLOWED_ORIGINS: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  DATABASE_PATH: './data/kansetsu.db',
  LOG_LEVEL: 'info',
  CACHE_TTL: 3600, // 1小时
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024 // 10MB
};

// 从环境变量加载配置
function loadEnvConfig(): EnvConfig {
  const config: EnvConfig = { ...defaultConfig };

  // NODE_ENV
  if (process.env.NODE_ENV) {
    const env = process.env.NODE_ENV as EnvConfig['NODE_ENV'];
    if (['development', 'production', 'test'].includes(env)) {
      config.NODE_ENV = env;
    }
  }

  // PORT
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT);
    if (!isNaN(port) && port > 0 && port < 65536) {
      config.PORT = port;
    }
  }

  // JWT_SECRET
  if (process.env.JWT_SECRET) {
    config.JWT_SECRET = process.env.JWT_SECRET;
  }

  // ALLOWED_ORIGINS
  if (process.env.ALLOWED_ORIGINS) {
    config.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }

  // DATABASE_PATH
  if (process.env.DATABASE_PATH) {
    config.DATABASE_PATH = process.env.DATABASE_PATH;
  }

  // LOG_LEVEL
  if (process.env.LOG_LEVEL) {
    const level = process.env.LOG_LEVEL as EnvConfig['LOG_LEVEL'];
    if (['debug', 'info', 'warn', 'error'].includes(level)) {
      config.LOG_LEVEL = level;
    }
  }

  // CACHE_TTL
  if (process.env.CACHE_TTL) {
    const ttl = parseInt(process.env.CACHE_TTL);
    if (!isNaN(ttl) && ttl > 0) {
      config.CACHE_TTL = ttl;
    }
  }

  // MAX_UPLOAD_SIZE
  if (process.env.MAX_UPLOAD_SIZE) {
    const size = parseInt(process.env.MAX_UPLOAD_SIZE);
    if (!isNaN(size) && size > 0) {
      config.MAX_UPLOAD_SIZE = size;
    }
  }

  return config;
}

// 验证配置
function validateConfig(config: EnvConfig): void {
  const errors: string[] = [];

  if (config.NODE_ENV === 'production' && config.JWT_SECRET === defaultConfig.JWT_SECRET) {
    errors.push('生产环境必须设置自定义的 JWT_SECRET');
  }

  if (config.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET 长度至少需要32个字符');
  }

  if (config.PORT < 1 || config.PORT > 65535) {
    errors.push('PORT 必须在1-65535范围内');
  }

  if (errors.length > 0) {
    throw new Error(`配置验证失败:\n${errors.join('\n')}`);
  }
}

// 导出配置
export const env = loadEnvConfig();

// 在应用启动时验证配置
try {
  validateConfig(env);
  console.log(`✅ 环境配置加载成功 (${env.NODE_ENV})`);
} catch (error) {
  console.error('❌ 环境配置验证失败:', error);
  process.exit(1);
}

// 开发环境下打印配置信息
if (env.NODE_ENV === 'development') {
  console.log('🔧 当前配置:', {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    DATABASE_PATH: env.DATABASE_PATH,
    LOG_LEVEL: env.LOG_LEVEL,
    CACHE_TTL: env.CACHE_TTL,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS
  });
}
