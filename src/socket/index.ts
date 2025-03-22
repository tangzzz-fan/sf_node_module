import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { SocketController } from '../controllers/SocketController';
import { SocketEvents, AuthenticatedSocket } from '../types';
import { logger } from '../utils/logger';

export function registerSocketHandlers(io: Server, controller: SocketController): void {
    // 中间件: 用于认证和提取用户信息
    io.use((socket: AuthenticatedSocket, next) => {
        try {
            const { username } = socket.handshake.auth;

            if (!username) {
                return next(new Error('认证失败: 缺少用户名'));
            }

            // 在实际应用中，这里应该验证 JWT 或其他认证令牌
            // 现在我们简单地为每个连接生成一个 UUID
            socket.userId = uuidv4();
            socket.username = username;

            next();
        } catch (error) {
            logger.error(`Socket 中间件错误: ${error}`);
            next(new Error('认证处理过程中发生错误'));
        }
    });

    // 连接事件
    io.on(SocketEvents.CONNECT, (socket: AuthenticatedSocket) => {
        controller.handleConnection(socket);

        // 注册事件处理程序
        socket.on(SocketEvents.DISCONNECT, () => {
            controller.handleDisconnect(socket);
        });

        socket.on(SocketEvents.MESSAGE_PRIVATE, (payload) => {
            controller.handlePrivateMessage(socket, payload);
        });

        socket.on(SocketEvents.MESSAGE_ROOM, (payload) => {
            controller.handleRoomMessage(socket, payload);
        });

        socket.on(SocketEvents.MESSAGE_READ, (messageId) => {
            controller.handleMessageRead(socket, messageId);
        });

        socket.on(SocketEvents.ROOM_JOINED, (payload) => {
            controller.handleJoinRoom(socket, payload);
        });

        socket.on(SocketEvents.ROOM_LEFT, (payload) => {
            controller.handleLeaveRoom(socket, payload);
        });

        socket.on(SocketEvents.ROOM_CREATED, (payload) => {
            controller.handleCreateRoom(socket, payload);
        });

        socket.on('error', (error) => {
            logger.error(`Socket 错误事件: ${error.message}`);
        });
    });
} 