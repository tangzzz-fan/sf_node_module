import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { extractTokenFromHeader } from './auth.utils';
import { logger } from '../utils/logger';

// 扩展Express请求类型，添加用户信息
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                username: string;
            };
        }
    }
}

/**
 * HTTP请求认证中间件
 * @param authService 认证服务实例
 * @returns Express中间件函数
 */
export const authenticate = (authService: AuthService) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // 从请求头中提取令牌
            const authHeader = req.headers.authorization;
            const token = extractTokenFromHeader(authHeader);

            if (!token) {
                return res.status(401).json({ message: '未提供认证令牌' });
            }

            // 验证令牌
            const user = authService.validateToken(token);
            if (!user) {
                return res.status(401).json({ message: '无效的认证令牌' });
            }

            // 将用户信息附加到请求对象
            req.user = user;
            next();
        } catch (error) {
            logger.error(`认证中间件错误: ${error}`);
            return res.status(500).json({ message: '认证处理过程中发生错误' });
        }
    };
};

/**
 * 可选认证中间件 - 如果提供了令牌则验证，但不强制要求
 * @param authService 认证服务实例
 * @returns Express中间件函数
 */
export const optionalAuthenticate = (authService: AuthService) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // 从请求头中提取令牌
            const authHeader = req.headers.authorization;
            const token = extractTokenFromHeader(authHeader);

            // 如果提供了令牌，则验证
            if (token) {
                const user = authService.validateToken(token);
                if (user) {
                    req.user = user;
                }
            }

            // 无论令牌是否有效，都继续处理请求
            next();
        } catch (error) {
            logger.error(`可选认证中间件错误: ${error}`);
            next();
        }
    };
};