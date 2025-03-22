import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface Config {
    nodeEnv: string;
    port: number;
    logLevel: string;
    corsOrigins: string[];
    jwtSecret: string;
    jwtExpiresIn: string;
}

export const config: Config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '6000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
    jwtSecret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
}; 