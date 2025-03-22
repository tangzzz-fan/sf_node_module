// 这是一个简单的客户端示例，展示如何连接到 WebSocket 服务器
import { io } from 'socket.io-client';
import { SocketEvents } from '../src/types';

// 服务器地址
const SERVER_URL = 'ws://localhost:6000';

// 创建一个客户端类
class ChatClient {
    private socket: any;
    private username: string;
    private connectedUsers: any[] = [];
    private rooms: any[] = [];

    constructor(username: string) {
        this.username = username;
        console.log(`创建客户端实例，用户名: ${username}, 服务器地址: ${SERVER_URL}`);

        // 初始化连接，使用合法的调试配置选项
        this.socket = io(SERVER_URL, {
            auth: {
                username: this.username
            },
            // 使用合法的调试相关选项
            forceNew: true,           // 强制创建新连接
            reconnection: true,       // 启用重连
            reconnectionAttempts: 5,  // 最大重连次数
            reconnectionDelay: 1000,  // 重连延迟(ms)
            timeout: 20000,           // 连接超时时间(ms)

            // 自定义连接选项
            extraHeaders: {
                'X-Client-Info': `ChatClient-${username}-${Date.now()}`
            }
        });

        // 注册基本事件监听器
        this.registerEventListeners();
        // 注册详细的调试监听器
        this.registerDebugListeners();
    }

    private registerEventListeners() {
        // 连接事件
        this.socket.on('connect', () => {
            console.log(`已连接到服务器，你好 ${this.username}!`);
            console.log(`Socket ID: ${this.socket.id}`);
            console.log(`当前传输方式: ${this.socket.io.engine.transport.name}`);

            // 记录连接头信息
            const headers = this.socket.io.engine.transport.extraHeaders || {};
            console.log('连接头信息:', JSON.stringify(headers, null, 2));

            // 尝试获取并打印底层 WebSocket 对象的信息
            if (this.socket.io.engine.transport.name === 'websocket') {
                const ws = this.socket.io.engine.transport.ws;
                if (ws) {
                    console.log('WebSocket 状态:', ws.readyState);
                    console.log('WebSocket URL:', ws.url);
                }
            }
        });

        // 连接错误
        this.socket.on('connect_error', (error: any) => {
            console.error('连接错误:', error.message);
            // 尝试提取更多错误信息
            if (error.description) {
                console.error('错误详情:', error.description);
            }
            if (error.context) {
                console.error('错误上下文:', error.context);
            }
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

    private registerDebugListeners() {
        // 记录所有发送的数据包
        if (this.socket.io && this.socket.io.engine) {
            // 监听引擎级别的数据包
            this.socket.io.engine.on('packetCreate', (packet: any) => {
                console.log('发送数据包:', JSON.stringify(packet, null, 2));
            });

            // 监听传输级别的请求
            this.socket.io.engine.transport.on('request', (req: any) => {
                console.log('HTTP请求:', {
                    method: req.method,
                    url: req.url,
                    headers: req.headers
                });
            });

            // 监听 WebSocket 特定事件（如果可用）
            if (this.socket.io.engine.transport.name === 'websocket') {
                const ws = this.socket.io.engine.transport.ws;
                if (ws) {
                    // 使用定时器监控 WebSocket 状态
                    const wsMonitor = setInterval(() => {
                        console.log('WebSocket 当前状态:', ws.readyState);
                        if (!this.socket.connected) {
                            clearInterval(wsMonitor);
                        }
                    }, 5000);

                    // 原始 WebSocket 消息
                    const originalSend = ws.send;
                    ws.send = (data: any) => {
                        console.log('WebSocket 发送原始数据:', {
                            type: typeof data,
                            length: data.length || 0,
                            // 仅显示前100个字符，避免日志过大
                            preview: typeof data === 'string' ? data.substring(0, 100) : '[非文本数据]'
                        });
                        return originalSend.call(ws, data);
                    };
                }
            }

            // 监听传输升级
            this.socket.io.engine.on('upgrade', (transport: any) => {
                console.log(`连接已升级到: ${transport.name}`);
                console.log('升级后的请求头:', this.socket.io.engine.transport.extraHeaders || {});
            });
        }

        // 监听所有事件
        this.socket.onAny((event: string, ...args: any[]) => {
            console.log(`收到事件: ${event}`, JSON.stringify(args, replacer, 2));
        });

        // 监听所有发出的事件
        const originalEmit = this.socket.emit;
        this.socket.emit = (event: string, ...args: any[]) => {
            console.log(`发送事件: ${event}`, JSON.stringify(args, replacer, 2));
            return originalEmit.apply(this.socket, [event, ...args]);
        };
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

// 用于处理循环引用的JSON替换函数
function replacer(key: string, value: any) {
    if (value === undefined) {
        return '[undefined]';
    }
    if (value === null) {
        return null;
    }
    if (typeof value === 'function') {
        return '[function]';
    }
    if (typeof value === 'object' && value !== null) {
        if (value instanceof Error) {
            return {
                error: value.name,
                message: value.message,
                stack: value.stack
            };
        }
        // 避免循环引用
        const seen = new Set();
        return Object.fromEntries(
            Object.entries(value).filter(([k, v]) => {
                if (seen.has(v)) return false;
                if (typeof v === 'object' && v !== null) seen.add(v);
                return true;
            })
        );
    }
    return value;
}

// 演示使用方法
async function demo() {
    console.log('启动WebSocket客户端演示，详细日志模式...');
    console.log('服务器地址:', SERVER_URL);

    // 创建客户端实例
    const alice = new ChatClient('Alice');

    // 等待一些时间确保连接建立
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 创建另一个客户端
    const bob = new ChatClient('Bob');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Alice 创建一个房间
    console.log('--- Alice创建房间测试 ---');
    alice.createRoom('Alice的房间', '这是一个测试房间');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 等待演示结束
    console.log('演示将在10秒后结束...');
    setTimeout(() => {
        console.log('演示结束，正在断开连接...');
        alice.disconnect();
        bob.disconnect();
    }, 10000);
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
    console.log('启动WebSocket客户端详细日志演示...');
    demo().catch(console.error);
}

export default ChatClient; 