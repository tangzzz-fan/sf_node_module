import { Server, Socket } from 'socket.io';
import { AuthService } from './auth.service';
import { AuthenticatedSocket } from './types';
import { logger } from '../utils/logger';

/**
 * Socket.IO认证中间件
 * @param authService 认证服务实例
 * @returns Socket.IO中间件函数
 */
export const authenticateSocket = (authService: AuthService) => {
    return (socket: Socket, next: (err?: Error) => void) => {
        try {
            logger.debug(`Socket连接尝试: ${socket.id}`);
            const { token } = socket.handshake.auth;

            if (!token) {
                logger.warn(`Socket认证失败: 缺少令牌 (${socket.id})`);
                return next(new Error('认证失败: 缺少令牌'));
            }

            // 详细日志以帮助调试
            logger.debug(`正在验证Socket令牌: ${token.substring(0, 15)}...`);

            // 验证令牌
            const user = authService.validateToken(token);
            if (!user) {
                logger.warn(`Socket认证失败: 无效的令牌 (${socket.id})`);
                return next(new Error('认证失败: 无效的令牌'));
            }

            // 将用户信息存储在socket.data中
            (socket as AuthenticatedSocket).data = { user };

            logger.info(`Socket认证成功: ${user.username} (${user.userId})`);
            next();
        } catch (error) {
            logger.error(`Socket认证中间件错误: ${error}`);
            next(new Error('认证处理过程中发生错误'));
        }
    };
};

/**
 * 保护需要认证的Socket事件处理程序
 * @param handler 事件处理函数
 * @returns 包装后的事件处理函数
 */
export const requireAuth = <T>(
    handler: (socket: AuthenticatedSocket, data: T) => void
) => {
    return (socket: Socket, data: T) => {
        const authenticatedSocket = socket as AuthenticatedSocket;

        // 检查socket.data中是否有用户信息
        if (!authenticatedSocket.data?.user) {
            socket.emit('error', { message: '未认证的操作' });
            return;
        }

        // 调用原始处理程序
        handler(authenticatedSocket, data);
    };
};