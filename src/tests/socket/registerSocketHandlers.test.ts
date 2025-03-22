import { Server } from 'socket.io';
import { registerSocketHandlers } from '../../socket';
import { SocketController } from '../../controllers/SocketController';
import { logger } from '../../utils/logger';
import { SocketEvents, AuthenticatedSocket } from '../../types';

// 模拟依赖
jest.mock('socket.io');
jest.mock('../../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

describe('Socket Handlers Registration', () => {
    let io: jest.Mocked<Server>;
    let controller: jest.Mocked<SocketController>;
    let mockSocket: Partial<AuthenticatedSocket>;

    beforeEach(() => {
        jest.clearAllMocks();

        // 创建模拟IO服务器
        io = {
            use: jest.fn(),
            on: jest.fn()
        } as unknown as jest.Mocked<Server>;

        // 创建模拟控制器
        controller = {
            handleConnection: jest.fn(),
            handleDisconnect: jest.fn(),
            handlePrivateMessage: jest.fn(),
            handleRoomMessage: jest.fn(),
            handleMessageRead: jest.fn(),
            handleJoinRoom: jest.fn(),
            handleLeaveRoom: jest.fn(),
            handleCreateRoom: jest.fn()
        } as unknown as jest.Mocked<SocketController>;

        // 创建更完整的模拟套接字
        mockSocket = {
            handshake: {
                auth: {
                    username: 'testuser'
                },
                headers: {},
                time: new Date().toString(),
                address: '127.0.0.1',
                xdomain: false,
                secure: false,
                issued: Date.now(),
                url: '/socket.io/',
                query: {}
            },
            on: jest.fn()
        };
    });

    test('应该注册认证中间件和连接事件', () => {
        registerSocketHandlers(io, controller);

        // 验证中间件是否已注册
        expect(io.use).toHaveBeenCalled();

        // 验证连接事件监听器是否已注册
        expect(io.on).toHaveBeenCalledWith(SocketEvents.CONNECT, expect.any(Function));
    });

    test('中间件应该验证用户名并设置用户ID', () => {
        registerSocketHandlers(io, controller);

        // 获取中间件函数
        const middleware = io.use.mock.calls[0][0];
        const next = jest.fn();

        // 调用中间件
        middleware(mockSocket as AuthenticatedSocket, next);

        // 验证结果
        expect(mockSocket.userId).toBeDefined();
        expect(mockSocket.username).toBe('testuser');
        expect(next).toHaveBeenCalled();
    });

    test('中间件应该拒绝缺少用户名的连接', () => {
        registerSocketHandlers(io, controller);

        // 获取中间件函数
        const middleware = io.use.mock.calls[0][0];
        const next = jest.fn();

        // 创建没有用户名的套接字
        const invalidSocket = {
            handshake: {
                auth: {},
                headers: {},
                time: new Date().toString(),
                address: '127.0.0.1',
                xdomain: false,
                secure: false,
                issued: Date.now(),
                url: '/socket.io/',
                query: {}
            }
        };

        // 调用中间件
        middleware(invalidSocket as AuthenticatedSocket, next);

        // 验证拒绝逻辑
        expect(next).toHaveBeenCalledWith(expect.any(Error));
        expect(next.mock.calls[0][0].message).toContain('缺少用户名');
    });

    test('应该为连接事件注册正确的处理程序', () => {
        registerSocketHandlers(io, controller);

        // 获取连接事件处理程序
        const connectHandler = io.on.mock.calls[0][1];

        // 调用连接事件处理程序
        connectHandler(mockSocket);

        // 验证控制器的handleConnection是否被调用
        expect(controller.handleConnection).toHaveBeenCalledWith(mockSocket);

        // 验证所有事件处理程序是否已注册到套接字
        expect(mockSocket.on).toHaveBeenCalledWith(SocketEvents.DISCONNECT, expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith(SocketEvents.MESSAGE_PRIVATE, expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith(SocketEvents.MESSAGE_ROOM, expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith(SocketEvents.MESSAGE_READ, expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith(SocketEvents.ROOM_JOINED, expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith(SocketEvents.ROOM_LEFT, expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith(SocketEvents.ROOM_CREATED, expect.any(Function));
    });
}); 