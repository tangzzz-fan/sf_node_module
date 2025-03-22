import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface CustomError extends Error {
    statusCode?: number;
}

export const errorMiddleware = (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || '服务器内部错误';

    logger.error(`[${req.method}] ${req.path} >> 状态码: ${statusCode}, 消息: ${message}`);

    if (process.env.NODE_ENV === 'development') {
        res.status(statusCode).json({
            success: false,
            message,
            stack: err.stack
        });
    } else {
        res.status(statusCode).json({
            success: false,
            message
        });
    }
}; 