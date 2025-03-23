/**
 * 简单的日志记录工具
 */
import winston from 'winston';
import chalk from 'chalk';

// 创建一个格式化消息内容的函数
const formatSocketMessage = (info: any) => {
    if (info.messageType) {
        let output = '';

        switch (info.messageType) {
            case 'private':
                output = `${chalk.blue('私聊')} ${chalk.green(info.from)} -> ${chalk.yellow(info.to)}: ${info.content}`;
                break;
            case 'room':
                output = `${chalk.magenta('房间')} ${chalk.green(info.from)} -> ${chalk.cyan(info.roomId)}: ${info.content}`;
                break;
            case 'system':
                output = `${chalk.red('系统')} ${chalk.green(info.from)}: ${info.content}`;
                break;
            default:
                output = `${chalk.gray(info.messageType)} ${info.content}`;
        }

        return output;
    }
    return info.message;
};

// 安全地将任意值转换为Date
const safeToDate = (value: unknown): Date => {
    if (value instanceof Date) {
        return value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value);
    }

    // 如果不是有效的Date输入，返回当前时间
    return new Date();
};

// 配置日志
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => {
            // 使用安全转换函数来处理timestamp
            const timestamp = safeToDate(info.timestamp).toISOString();
            return `${timestamp} [${info.level.toUpperCase()}]: ${formatSocketMessage(info)}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf((info) => {
                    // 使用安全转换函数来处理timestamp
                    const timestamp = safeToDate(info.timestamp).toISOString();
                    return `${timestamp} [${info.level.toUpperCase()}]: ${formatSocketMessage(info)}`;
                })
            )
        }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
}); 