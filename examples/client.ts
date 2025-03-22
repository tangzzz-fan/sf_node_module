// 这是一个简单的客户端示例，展示如何连接到 WebSocket 服务器
import { io } from 'socket.io-client';
import { SocketEvents } from '../src/types';

// 替换为你的服务器地址
const SERVER_URL = 'http://localhost:3000';

// 创建一个客户端类
class ChatClient {
    private socket: any;
    private username: string;
    private connectedUsers: any[] = [];
    private rooms: any[] = [];

    constructor(username: string) {
        this.username = username;

        // 初始化连接
        this.socket = io(SERVER_URL, {
            auth: {
                username: this.username
            }
        });

        // 注册事件监听器
        this.registerEventListeners();
    }

    private registerEventListeners() {
        // 连接事件
        this.socket.on('connect', () => {
            console.log(`已连接到服务器，你好 ${this.username}!`);
        });

        // 连接错误
        this.socket.on('connect_error', (error: any) => {
            console.error('连接错误:', error.message);
        });

        // 用户列表
        this.socket.on(SocketEvents.USERS_LIST, (users: any[]) => {
            console.log(`当前在线用户数: ${users.length}`);
            this.connectedUsers = users;
            users.forEach(user => {
                if (user.username !== this.username) {
                    console.log(`- ${user.username} (${user.id})`);
                }
            });
        });

        // 房间列表
        this.socket.on(SocketEvents.ROOM_LIST, (rooms: any[]) => {
            console.log(`可用聊天室数: ${rooms.length}`);
            this.rooms = rooms;
            rooms.forEach(room => {
                console.log(`- ${room.name} (${room.id}), 成员数: ${room.members?.length || 0}`);
            });
        });

        // 用户加入
        this.socket.on(SocketEvents.USER_JOINED, (data: any) => {
            console.log(`用户已加入: ${data.username}`);
        });

        // 用户离开
        this.socket.on(SocketEvents.USER_LEFT, (data: any) => {
            console.log(`用户已离开: ${data.username}`);
        });

        // 私人消息
        this.socket.on(SocketEvents.MESSAGE_PRIVATE, (message: any) => {
            console.log(`[私信] ${message.fromUsername}: ${message.content}`);

            // 自动标记为已读
            this.socket.emit(SocketEvents.MESSAGE_READ, message.id);
        });

        // 房间消息
        this.socket.on(SocketEvents.MESSAGE_ROOM, (message: any) => {
            const room = this.rooms.find(r => r.id === message.to);
            console.log(`[${room?.name || message.to}] ${message.fromUsername}: ${message.content}`);
        });

        // 消息发送确认
        this.socket.on(SocketEvents.MESSAGE_SENT, (message: any) => {
            console.log(`消息已发送成功 (ID: ${message.id})`);
        });

        // 用户加入房间
        this.socket.on(SocketEvents.USER_JOINED_ROOM, (data: any) => {
            const room = this.rooms.find(r => r.id === data.roomId);
            console.log(`用户 ${data.username} 加入了房间 "${room?.name || data.roomId}"`);
        });

        // 用户离开房间
        this.socket.on(SocketEvents.USER_LEFT_ROOM, (data: any) => {
            const room = this.rooms.find(r => r.id === data.roomId);
            console.log(`用户 ${data.username} 离开了房间 "${room?.name || data.roomId}"`);
        });

        // 房间创建
        this.socket.on(SocketEvents.ROOM_CREATED, (room: any) => {
            console.log(`新房间已创建: ${room.name} (${room.id})`);
            this.rooms.push(room);
        });

        // 错误
        this.socket.on(SocketEvents.ERROR, (error: any) => {
            console.error('服务器错误:', error.message);
        });

        // 断开连接
        this.socket.on('disconnect', () => {
            console.log('与服务器断开连接');
        });
    }

    // 发送私人消息
    public sendPrivateMessage(userId: string, content: string): void {
        if (!this.isUserOnline(userId)) {
            console.error('用户不在线或不存在');
            return;
        }

        this.socket.emit(SocketEvents.MESSAGE_PRIVATE, {
            to: userId,
            content
        });

        const recipient = this.connectedUsers.find(u => u.id === userId);
        console.log(`向 ${recipient?.username || userId} 发送私信: ${content}`);
    }

    // 发送房间消息
    public sendRoomMessage(roomId: string, content: string): void {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            console.error('房间不存在');
            return;
        }

        this.socket.emit(SocketEvents.MESSAGE_ROOM, {
            roomId,
            content
        });

        console.log(`向房间 "${room.name}" 发送消息: ${content}`);
    }

    // 创建房间
    public createRoom(name: string, description: string = '', isPrivate: boolean = false): void {
        this.socket.emit(SocketEvents.ROOM_CREATED, {
            name,
            description,
            isPrivate
        });

        console.log(`正在创建新房间: "${name}"`);
    }

    // 加入房间
    public joinRoom(roomId: string): void {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            console.error('房间不存在');
            return;
        }

        this.socket.emit(SocketEvents.ROOM_JOINED, { roomId });
        console.log(`正在加入房间: "${room.name}"`);
    }

    // 离开房间
    public leaveRoom(roomId: string): void {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            console.error('房间不存在');
            return;
        }

        this.socket.emit(SocketEvents.ROOM_LEFT, { roomId });
        console.log(`正在离开房间: "${room.name}"`);
    }

    // 断开连接
    public disconnect(): void {
        this.socket.disconnect();
        console.log('断开与服务器的连接');
    }

    // 检查用户是否在线
    private isUserOnline(userId: string): boolean {
        return this.connectedUsers.some(u => u.id === userId);
    }

    // 获取用户名通过ID
    public getUsernameById(userId: string): string | undefined {
        const user = this.connectedUsers.find(u => u.id === userId);
        return user?.username;
    }

    // 获取在线用户列表
    public getOnlineUsers(): any[] {
        return this.connectedUsers.filter(u => u.username !== this.username);
    }

    // 获取可用房间列表
    public getAvailableRooms(): any[] {
        return this.rooms;
    }
}

// 演示使用方法
async function demo() {
    // 创建两个客户端实例
    const alice = new ChatClient('Alice');

    // 等待一些时间确保连接建立
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 创建另一个客户端
    const bob = new ChatClient('Bob');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Alice 创建一个房间
    alice.createRoom('Alice的房间', '这是一个测试房间');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 等待 Bob 收到房间列表后加入房间
    setTimeout(() => {
        const rooms = bob.getAvailableRooms();
        if (rooms.length > 0) {
            bob.joinRoom(rooms[0].id);

            // Bob 发送一个房间消息
            setTimeout(() => {
                bob.sendRoomMessage(rooms[0].id, '大家好，这是Bob!');
            }, 500);
        }
    }, 1500);

    // Alice 发送一个私人消息给 Bob
    setTimeout(() => {
        const users = alice.getOnlineUsers();
        if (users.length > 0) {
            const bobUser = users.find(u => u.username === 'Bob');
            if (bobUser) {
                alice.sendPrivateMessage(bobUser.id, '你好，Bob!');
            }
        }
    }, 3000);

    // 几秒钟后断开连接
    setTimeout(() => {
        console.log('演示结束，正在断开连接...');
        alice.disconnect();
        bob.disconnect();
    }, 10000);
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
    console.log('启动WebSocket客户端演示...');
    demo().catch(console.error);
}

export default ChatClient; 