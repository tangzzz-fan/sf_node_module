import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
    User,
    Message,
    Room,
    PrivateMessagePayload,
    RoomMessagePayload,
    JoinRoomPayload,
    CreateRoomPayload,
    SocketEvents
} from '../types';
import { AuthenticatedSocket } from '../auth/types';
import { UserService } from '../services/UserService';
import { MessageService } from '../services/MessageService';
import { logger } from '../utils/logger';

export class SocketController {
    private io: Server;
    private userService: UserService;
    private messageService: MessageService;
    private rooms: Map<string, Room> = new Map();

    constructor(io: Server, userService: UserService, messageService: MessageService) {
        this.io = io;
        this.userService = userService;
        this.messageService = messageService;
    }

    /**
     * 处理用户连接
     */
    public handleConnection(socket: AuthenticatedSocket): void {
        const { user } = socket.data;

        if (!user) {
            return this.handleError(socket, '无效的用户认证信息');
        }

        logger.info(`用户已连接: ${user.username} (ID: ${user.userId})`);

        // 将用户添加到用户服务
        const userRecord: User = {
            userId: user.userId,
            username: user.username,
            socketId: socket.id,
            connected: true,
            lastActive: new Date()
        };

        this.userService.addUser(userRecord);

        // 广播用户加入事件
        socket.broadcast.emit(SocketEvents.USER_JOINED, {
            userId: user.userId,
            username: user.username
        });

        // 发送用户列表
        socket.emit(SocketEvents.USERS_LIST, this.userService.getAllUsers());

        // 发送房间列表
        socket.emit(SocketEvents.ROOM_LIST, Array.from(this.rooms.values()));
    }

    /**
     * 处理用户断开连接
     */
    public handleDisconnect(socket: AuthenticatedSocket): void {
        const { userId, username } = socket.data.user;

        if (!userId) return;

        logger.info(`用户已断开连接: ${username} (ID: ${userId})`);

        // 从用户服务中移除用户
        this.userService.removeUser(userId);

        // 广播用户离开事件
        this.io.emit(SocketEvents.USER_LEFT, {
            userId,
            username
        });
    }

    /**
     * 处理私人消息
     */
    public handlePrivateMessage(socket: AuthenticatedSocket, payload: PrivateMessagePayload): void {
        const { userId, username } = socket.data.user;
        const { recipientId, content } = payload;

        if (!userId || !username) {
            return this.handleError(socket, '未授权');
        }

        const recipient = this.userService.getUserById(recipientId);

        if (!recipient) {
            return this.handleError(socket, '用户不存在或已离线');
        }

        const message: Message = this.messageService.createMessage({
            from: userId,
            fromUsername: username,
            to: recipientId,
            content,
            isRoomMessage: false,
            timestamp: new Date(),
            read: false
        });

        // 使用控制台直接打印消息
        console.log('\n>>>> 处理私聊消息 <<<<');
        console.log('发送者:', username, `(${userId})`);
        console.log('接收者:', recipient.username, `(${recipientId})`);
        console.log('消息内容:', content);
        console.log('消息ID:', message.id);
        console.log('时间戳:', message.timestamp);
        console.log('>>>>>>>>>>>>>>>>>>>>>>\n');

        // 使用logger记录详细信息
        logger.info(`私聊消息: ${username} -> ${recipient.username}`, {
            messageType: 'private',
            from: userId,
            fromName: username,
            to: recipientId,
            toName: recipient.username,
            content: content,
            messageId: message.id,
            timestamp: message.timestamp.toISOString()
        });

        // 发送给接收者
        this.io.to(recipient.socketId).emit(SocketEvents.MESSAGE_PRIVATE, message);

        // 确认消息已发送
        socket.emit(SocketEvents.MESSAGE_SENT, message);
    }

    /**
     * 处理房间消息
     */
    public handleRoomMessage(socket: AuthenticatedSocket, payload: RoomMessagePayload): void {
        const { userId, username } = socket.data.user;
        const { roomId, content } = payload;

        if (!userId || !username) {
            return this.handleError(socket, '未授权');
        }

        const room = this.rooms.get(roomId);

        if (!room) {
            return this.handleError(socket, '房间不存在');
        }

        if (!room.members.includes(userId)) {
            return this.handleError(socket, '您不是该房间的成员');
        }

        const message: Message = this.messageService.createMessage({
            from: userId,
            fromUsername: username,
            to: roomId,
            content,
            isRoomMessage: true,
            timestamp: new Date(),
            read: false
        });

        // 使用控制台直接打印消息
        console.log('\n>>>> 处理房间消息 <<<<');
        console.log('发送者:', username, `(${userId})`);
        console.log('房间:', room.name, `(${roomId})`);
        console.log('成员数:', room.members.length);
        console.log('消息内容:', content);
        console.log('消息ID:', message.id);
        console.log('时间戳:', message.timestamp);
        console.log('>>>>>>>>>>>>>>>>>>>>>>\n');

        // 使用logger记录详细信息
        logger.info(`房间消息: ${username} -> 房间 ${room.name}`, {
            messageType: 'room',
            from: userId,
            fromName: username,
            roomId: roomId,
            roomName: room.name,
            content: content,
            messageId: message.id,
            timestamp: message.timestamp.toISOString(),
            memberCount: room.members.length
        });

        // 发送给房间所有成员
        this.io.to(roomId).emit(SocketEvents.MESSAGE_ROOM, message);

        // 确认消息已发送
        socket.emit(SocketEvents.MESSAGE_SENT, message);
    }

    /**
     * 处理加入房间
     */
    public handleJoinRoom(socket: AuthenticatedSocket, payload: JoinRoomPayload): void {
        const { userId, username } = socket.data.user;
        const { roomId } = payload;

        if (!userId || !username) {
            return this.handleError(socket, '未授权');
        }

        const room = this.rooms.get(roomId);

        if (!room) {
            return this.handleError(socket, '房间不存在');
        }

        // 检查房间是否为私有且用户是否有权限加入
        if (room.isPrivate && !room.members.includes(userId)) {
            return this.handleError(socket, '无权加入该私有房间');
        }

        // 将用户加入房间
        socket.join(roomId);

        // 如果用户不在成员列表中，则添加
        if (!room.members.includes(userId)) {
            room.members.push(userId);
            this.rooms.set(roomId, room);
        }

        // 通知房间其他成员
        socket.to(roomId).emit(SocketEvents.USER_JOINED_ROOM, {
            roomId,
            userId,
            username
        });

        logger.info(`用户 ${username} 加入房间 ${roomId}`);
    }

    /**
     * 处理离开房间
     */
    public handleLeaveRoom(socket: AuthenticatedSocket, payload: JoinRoomPayload): void {
        const { userId, username } = socket.data.user;
        const { roomId } = payload;

        if (!userId || !username) {
            return this.handleError(socket, '未授权');
        }

        const room = this.rooms.get(roomId);

        if (!room) {
            return this.handleError(socket, '房间不存在');
        }

        // 让用户离开房间
        socket.leave(roomId);

        // 从成员列表中移除用户
        room.members = room.members.filter(id => id !== userId);
        this.rooms.set(roomId, room);

        // 通知房间其他成员
        socket.to(roomId).emit(SocketEvents.USER_LEFT_ROOM, {
            roomId,
            userId,
            username
        });

        logger.info(`用户 ${username} 离开房间 ${roomId}`);
    }

    /**
     * 处理创建房间
     */
    public handleCreateRoom(socket: AuthenticatedSocket, payload: CreateRoomPayload): void {
        const { userId, username } = socket.data.user;
        const { name, description, isPrivate, initialMembers } = payload;

        if (!userId || !username) {
            return this.handleError(socket, '未授权');
        }

        const roomId = uuidv4();
        const room: Room = {
            id: roomId,
            name,
            description,
            createdAt: new Date(),
            isPrivate: isPrivate || false,
            members: initialMembers ? [...initialMembers, userId] : [userId]
        };

        // 保存房间
        this.rooms.set(roomId, room);

        // 让创建者加入房间
        socket.join(roomId);

        // 告知创建者房间已创建
        socket.emit(SocketEvents.ROOM_CREATED, room);

        // 如果是公共房间，广播给所有用户
        if (!room.isPrivate) {
            this.io.emit(SocketEvents.ROOM_CREATED, {
                id: room.id,
                name: room.name,
                description: room.description,
                isPrivate: room.isPrivate,
                createdAt: room.createdAt
            });
        } else {
            // 如果是私有房间，只通知房间成员
            room.members.forEach(memberId => {
                const member = this.userService.getUserById(memberId);
                if (member && member.socketId !== socket.id) {
                    this.io.to(member.socketId).emit(SocketEvents.ROOM_CREATED, room);
                }
            });
        }

        logger.info(`用户 ${username} 创建了房间: ${name} (ID: ${roomId})`);
    }

    /**
     * 标记消息为已读
     */
    public handleMessageRead(socket: AuthenticatedSocket, messageId: string): void {
        const { userId } = socket.data.user;

        if (!userId) {
            return this.handleError(socket, '未授权');
        }

        const message = this.messageService.getMessageById(messageId);

        if (!message) {
            return this.handleError(socket, '消息不存在');
        }

        if (message.to !== userId) {
            return this.handleError(socket, '无权修改此消息的状态');
        }

        message.read = true;
        this.messageService.updateMessage(message);

        // 通知发件人消息已读
        const sender = this.userService.getUserById(message.from);
        if (sender) {
            this.io.to(sender.socketId).emit(SocketEvents.MESSAGE_READ, {
                messageId,
                readAt: new Date()
            });
        }
    }

    /**
     * 错误处理
     */
    private handleError(socket: Socket, message: string): void {
        logger.error(`Socket 错误: ${message}`);
        socket.emit(SocketEvents.ERROR, { message });
    }
}