import { Server } from 'socket.io';
import { SocketController } from '../controllers/SocketController';
import { SocketEvents } from '../types';
import { AuthenticatedSocket } from '../auth/types';
import { requireAuth } from '../auth';
import { logger } from '../utils/logger';

// 定义系统消息接口
interface SystemMessage {
    content: string;
    timestamp: number;
}

export function registerSocketHandlers(io: Server, controller: SocketController): void {
    // 监听Socket.IO服务器上的所有底层事件（增强调试）
    io.engine.on('connection', (rawSocket) => {
        console.log('⚡ 底层Socket连接已建立:', rawSocket.id);

        // 监听原始数据 - 修复类型错误
        rawSocket.on('data', (data: Buffer | string) => {
            try {
                const dataStr = data.toString();
                console.log('📥 接收到原始数据:', {
                    type: typeof dataStr,
                    length: dataStr.length,
                    preview: dataStr.length > 100 ? dataStr.substring(0, 100) + '...' : dataStr
                });
            } catch (error) {
                console.error('无法解析原始数据:', error);
            }
        });

        // 监听发送的数据 - 修复类型错误
        rawSocket.on('packetCreate', (packet: any) => {
            console.log('📤 发送数据包:', packet);
        });
    });

    // 添加全局消息拦截中间件
    io.use((socket, next) => {
        // 直接记录原始socket对象，用于调试
        console.log('🔌 新的Socket连接尝试:', {
            id: socket.id,
            handshake: {
                query: socket.handshake.query,
                auth: socket.handshake.auth
            }
        });

        next();
    });

    // 连接事件 
    io.on(SocketEvents.CONNECT, (socket: AuthenticatedSocket) => {
        logger.info(`用户已连接: ${socket.data?.user?.username || 'unknown'}, Socket ID: ${socket.id}`);

        // 【重要】监听所有事件，不过滤任何事件名称 - 修复类型错误
        socket.onAny((event: string, ...args: any[]) => {
            // 打印所有事件，不管是什么名称
            console.log('\n📨 收到Socket事件 📨');
            console.log('事件名称:', event);
            console.log('发送者:', socket.data?.user?.username || 'unknown');
            console.log('数据内容:', JSON.stringify(args, null, 2));
            console.log('------------------------\n');

            // 记录到日志系统
            logger.debug(`收到事件: ${event}`, {
                event,
                socketId: socket.id,
                userId: socket.data?.user?.userId,
                username: socket.data?.user?.username,
                data: args
            });
        });

        // 记录所有发出的事件
        const originalEmit = socket.emit;
        socket.emit = function (event: string, ...args: any[]): boolean {
            // 记录除了特定内部事件之外的所有事件
            if (event !== 'error' && !event.startsWith('engine')) {
                console.log('\n📤 服务器发送事件 📤');
                console.log('事件名称:', event);
                console.log('发送给:', socket.data?.user?.username || 'unknown');
                console.log('数据内容:', JSON.stringify(args, null, 2));
                console.log('------------------------\n');
            }
            return originalEmit.apply(this, [event, ...args]);
        };

        controller.handleConnection(socket);

        // 注册事件处理程序
        socket.on(SocketEvents.DISCONNECT, (reason: string) => {
            logger.info(`用户已断开连接: ${socket.data?.user?.username || 'unknown'}, 原因: ${reason || 'unknown'}`);
            controller.handleDisconnect(socket);
        });

        // 【关键修复】添加system:message事件处理程序 - 修复类型错误
        socket.on('system:message', (data: SystemMessage) => {
            const user = socket.data?.user;
            console.log('\n===== 接收到系统消息 =====');
            console.log('发送者:', user?.username || 'unknown');
            console.log('内容:', data.content);
            console.log('时间戳:', new Date(data.timestamp).toISOString());
            console.log('===========================\n');

            // 使用logger记录
            logger.info(`系统消息: ${data.content}`, {
                messageType: 'system',
                from: user?.userId || 'unknown',
                fromName: user?.username || 'unknown',
                content: data.content,
                timestamp: new Date(data.timestamp).toISOString()
            });

            // 广播系统消息给所有连接的用户
            socket.broadcast.emit('system:message', {
                userId: user?.userId,
                username: user?.username,
                content: data.content,
                timestamp: data.timestamp
            });

            // 确认消息已接收
            socket.emit('system:ack', {
                received: true,
                timestamp: Date.now()
            });
        });

        // 私聊消息 - 修复类型错误
        socket.on(SocketEvents.MESSAGE_PRIVATE, (payload: any) => {
            console.log('\n===== 收到私聊消息 =====');
            console.log('发送者:', socket.data?.user?.username);
            console.log('消息内容:', payload);
            console.log('=======================\n');

            controller.handlePrivateMessage(socket, payload);
        });

        // 房间消息 - 修复类型错误
        socket.on(SocketEvents.MESSAGE_ROOM, (payload: any) => {
            console.log('\n===== 收到房间消息 =====');
            console.log('发送者:', socket.data?.user?.username);
            console.log('房间ID:', payload.roomId);
            console.log('消息内容:', payload.content);
            console.log('=======================\n');

            controller.handleRoomMessage(socket, payload);
        });

        // 其他事件处理程序
        socket.on(SocketEvents.MESSAGE_READ, requireAuth((authenticatedSocket, messageId) => {
            controller.handleMessageRead(authenticatedSocket, messageId);
        }));

        socket.on(SocketEvents.ROOM_JOINED, requireAuth((authenticatedSocket, payload) => {
            controller.handleJoinRoom(socket, payload);
        }));

        socket.on(SocketEvents.ROOM_LEFT, (payload: any) => {
            controller.handleLeaveRoom(socket, payload);
        });

        socket.on(SocketEvents.ROOM_CREATED, (payload: any) => {
            console.log('\n===== 创建房间请求 =====');
            console.log('创建者:', socket.data?.user?.username);
            console.log('房间信息:', payload);
            console.log('=======================\n');

            controller.handleCreateRoom(socket, payload);
        });

        socket.on('error', (error: Error) => {
            logger.error(`Socket 错误事件: ${error.message}`);
        });
    });
}