import { Server } from 'socket.io';
import { SocketController } from '../controllers/SocketController';
import { UserService } from '../services/UserService';
import { MessageService } from '../services/MessageService';
import {
    AuthenticatedSocket,
    SocketEvents,
    User,
    Message,
    Room
} from '../types';

// 模拟 socket.io 服务器和套接字
jest.mock('socket.io');
jest.mock('../utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

describe('SocketController', () => {
    let io: Server;
    let userService: UserService;
    let messageService: MessageService;
    let socketController: SocketController;
    let mockSocket: AuthenticatedSocket;

    beforeEach(() => {
        // 重置模拟
        jest.clearAllMocks();

        // 创建模拟服务
        io = new Server() as jest.Mocked<Server>;
        userService = new UserService();
        messageService = new MessageService();

        // 初始化控制器
        socketController = new SocketController(io, userService, messageService);

        // 创建模拟套接字，增加rooms属性
        const emitMock = jest.fn();
        mockSocket = {
            id: 'socket-id-1',
            userId: 'user-id-1',
            username: 'testuser',
            emit: emitMock,
            broadcast: {
                emit: jest.fn()
            },
            join: jest.fn(),
            leave: jest.fn(),
            rooms: new Set() // 添加rooms属性
        } as unknown as AuthenticatedSocket;

        // 修改to和emit模拟，避免重复声明
        mockSocket.to = jest.fn().mockReturnValue({
            emit: jest.fn()
        });

        // 模拟 io.to 方法
        (io as any).to = jest.fn().mockReturnValue({
            emit: jest.fn()
        });

        // 添加用户到服务，以便后续测试
        socketController.handleConnection(mockSocket);
    });

    test('handleConnection 应该注册用户并广播用户连接', () => {
        // 验证用户是否已添加到服务
        const user = userService.getUserById('user-id-1');
        expect(user).toBeDefined();
        expect(user?.username).toBe('testuser');

        // 验证是否已广播用户加入事件
        expect(mockSocket.broadcast.emit).toHaveBeenCalledWith(
            SocketEvents.USER_JOINED,
            expect.objectContaining({
                userId: 'user-id-1',
                username: 'testuser'
            })
        );

        // 验证是否已向用户发送当前用户列表
        expect(mockSocket.emit).toHaveBeenCalledWith(
            SocketEvents.USERS_LIST,
            expect.any(Array)
        );
    });

    test('handleDisconnect 应该移除用户并广播用户离开', () => {
        // 然后处理断开连接
        socketController.handleDisconnect(mockSocket);

        // 验证用户是否已从服务中移除
        expect(userService.getUserById('user-id-1')).toBeUndefined();

        // 验证是否已广播用户离开事件
        expect(io.emit).toHaveBeenCalledWith(
            SocketEvents.USER_LEFT,
            expect.objectContaining({
                userId: 'user-id-1',
                username: 'testuser'
            })
        );
    });

    test('handlePrivateMessage 应该发送私人消息', () => {
        // 添加接收消息的用户
        const recipientUser: User = {
            id: 'user-id-2',
            username: 'recipient',
            socketId: 'socket-id-2',
            connected: true,
            lastActive: new Date()
        };
        userService.addUser(recipientUser);

        // 发送私人消息
        socketController.handlePrivateMessage(mockSocket, {
            to: 'user-id-2',
            content: 'Hello, recipient!'
        });

        // 验证消息是否发送到接收者
        expect(io.to).toHaveBeenCalledWith('socket-id-2');
        expect(io.to('socket-id-2').emit).toHaveBeenCalledWith(
            SocketEvents.MESSAGE_PRIVATE,
            expect.objectContaining({
                from: 'user-id-1',
                fromUsername: 'testuser',
                to: 'user-id-2',
                content: 'Hello, recipient!'
            })
        );

        // 验证发送者是否收到确认
        expect(mockSocket.emit).toHaveBeenCalledWith(
            SocketEvents.MESSAGE_SENT,
            expect.any(Object)
        );
    });

    test('handleRoomMessage 应该发送房间消息', () => {
        // 创建房间
        const roomId = 'room-1';

        // 手动添加房间到controller
        (socketController as any).rooms.set(roomId, {
            id: roomId,
            name: 'Test Room',
            description: 'A test room',
            isPrivate: false,
            createdAt: new Date(),
            members: ['user-id-1']
        });

        // 手动将socket添加到房间
        mockSocket.rooms.add(roomId);

        // 直接修改socket.id和roomId的关联 - 这模拟Socket.IO内部状态
        (socketController as any).io.sockets = {
            adapter: {
                rooms: new Map([[roomId, new Set(['socket-id-1'])]])
            }
        };

        // 发送房间消息
        socketController.handleRoomMessage(mockSocket, {
            roomId,
            content: 'Hello, room!'
        });

        // 修改断言，使用正确的方法名
        const messages = messageService.getRoomMessages(roomId);
        expect(messages.length).toBeGreaterThan(0);
        expect(messages[0].content).toBe('Hello, room!');
    });

    test('handleJoinRoom 应该加入房间', () => {
        // 创建房间
        const roomId = 'room-1';
        // 手动添加房间到controller
        (socketController as any).rooms.set(roomId, {
            id: roomId,
            name: 'Test Room',
            description: 'A test room',
            isPrivate: false,
            createdAt: new Date(),
            members: []
        });

        // 创建另一个用户
        const otherSocket = {
            id: 'socket-id-2',
            userId: 'user-id-2',
            username: 'other-user',
            emit: jest.fn(),
            broadcast: {
                emit: jest.fn()
            },
            join: jest.fn(),
            leave: jest.fn(),
            to: jest.fn().mockReturnValue({
                emit: jest.fn()
            })
        } as unknown as AuthenticatedSocket;

        userService.addUser({
            id: 'user-id-2',
            username: 'other-user',
            socketId: 'socket-id-2',
            connected: true,
            lastActive: new Date()
        });

        // 执行加入房间
        socketController.handleJoinRoom(otherSocket, { roomId });

        // 验证套接字是否调用了 join 方法
        expect(otherSocket.join).toHaveBeenCalledWith(roomId);

        // 验证是否向房间其他成员发送了通知
        expect(otherSocket.to).toHaveBeenCalledWith(roomId);
    });

    test('handleLeaveRoom 应该离开房间', () => {
        // 创建房间
        const roomId = 'room-1';
        // 手动添加房间到controller
        (socketController as any).rooms.set(roomId, {
            id: roomId,
            name: 'Test Room',
            description: 'A test room',
            isPrivate: false,
            createdAt: new Date(),
            members: ['user-id-1']
        });

        // 手动将socket join到房间 (模拟已经加入了房间)
        (mockSocket as any).rooms = new Set([roomId]);

        // 执行离开房间
        socketController.handleLeaveRoom(mockSocket, { roomId });

        // 验证套接字是否调用了 leave 方法
        expect(mockSocket.leave).toHaveBeenCalledWith(roomId);

        // 验证是否通知了房间其他成员
        expect(mockSocket.to).toHaveBeenCalledWith(roomId);
    });
}); 