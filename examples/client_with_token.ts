/**
 * 有令牌客户端示例 (增强版)
 * 演示认证成功后的会话创建，包含详细的调试信息和高级功能
 */
import { io } from 'socket.io-client';
import { SocketEvents } from '../src/types';

// 认证和连接配置
const AUTH_SERVER_URL = 'http://localhost:3000';
const SOCKET_SERVER_URL = 'http://localhost:6000';

// 为登录响应定义接口
interface LoginResponse {
    token: string;
    user: {
        userId: string;
        email: string;
        username: string;
    };
}

class AuthenticatedClient {
    private socket: any;
    private token: string;
    private user: {
        userId: string;
        username: string;
        email: string;
    };
    private connectedUsers: any[] = [];
    private rooms: any[] = [];
    private connected: boolean = false;
    private debug: boolean;

    constructor(token: string, user: LoginResponse['user'], debug: boolean = false) {
        this.token = token;
        this.user = user;
        this.debug = debug;
        console.log(`创建已认证客户端实例，用户: ${user.username}`);
    }

    /**
     * 使用令牌连接到Socket服务器
     */
    public connect(): boolean {
        if (!this.token) {
            console.error('错误: 未提供令牌，无法连接');
            return false;
        }

        console.log(`正在连接到Socket服务器: ${SOCKET_SERVER_URL}`);

        // 使用令牌创建Socket连接
        this.socket = io(SOCKET_SERVER_URL, {
            auth: {
                token: this.token
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,  // 连接超时时间

            // 添加额外的连接信息
            extraHeaders: {
                'X-Client-Info': `AuthClient-${this.user.username}-${Date.now()}`
            }
        });

        // 注册事件监听器
        this.registerEventListeners();

        // 如果开启了调试模式，注册详细的调试监听器
        if (this.debug) {
            this.registerDebugListeners();
        }

        return true;
    }

    /**
     * 注册Socket事件监听器
     */
    private registerEventListeners(): void {
        // 基本连接事件
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('✅ 已成功连接到服务器（认证有效）');
            console.log(`Socket ID: ${this.socket.id}`);
            console.log(`当前传输方式: ${this.socket.io.engine.transport.name}`);

            // 连接成功后执行操作
            this.onConnected();
        });

        this.socket.on('connect_error', (error: any) => {
            console.error('❌ 连接错误:', error.message);

            if (error.message.includes('认证失败') || error.message.includes('auth')) {
                console.error('认证问题: 令牌可能无效或已过期');
            }

            // 提取更多错误信息
            if (error.description) {
                console.error('错误详情:', error.description);
            }
            if (error.context) {
                console.error('错误上下文:', error.context);
            }
        });

        this.socket.on('disconnect', (reason: string) => {
            this.connected = false;
            console.log(`断开连接: ${reason}`);
        });

        // 聊天相关事件
        this.socket.on(SocketEvents.USERS_LIST, (users: any[]) => {
            this.connectedUsers = users;
            console.log(`当前在线用户数: ${users.length}`);
            console.log('已更新用户列表:', users.map(u => u.username).join(', '));
        });

        this.socket.on(SocketEvents.ROOM_LIST, (rooms: any[]) => {
            this.rooms = rooms;
            console.log(`可用聊天室数: ${rooms.length}`);
            console.log('可用聊天室:', rooms.map(r => `${r.name} (${r.id}), 成员数: ${r.members?.length || 0}`).join(', '));
        });

        // 消息事件
        this.socket.on('message:received', (message: any) => {
            console.log(`新消息 [${message.sender}]: ${message.content}`);
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

        this.socket.on(SocketEvents.USER_JOINED, (user: any) => {
            console.log(`用户已加入: ${user.username}`);
        });

        this.socket.on(SocketEvents.USER_LEFT, (user: any) => {
            console.log(`用户已离开: ${user.username}`);
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
    }

    /**
     * 注册详细的调试监听器
     */
    private registerDebugListeners(): void {
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

    /**
     * 连接成功后执行的操作
     */
    private onConnected(): void {
        console.log(`🎉 用户 ${this.user.username} 已认证并连接成功`);

        // 执行一系列演示操作
        setTimeout(() => this.createRoom('我的聊天室'), 1000);
        setTimeout(() => this.sendSystemMessage(`大家好，用户 ${this.user.username} 已上线！`), 2000);
    }

    /**
     * 创建聊天室
     */
    public createRoom(name: string, description: string = '', isPrivate: boolean = false): void {
        if (!this.connected) {
            console.error('无法创建聊天室: 未连接到服务器');
            return;
        }

        console.log(`尝试创建聊天室: ${name}`);
        this.socket.emit(SocketEvents.ROOM_CREATED, {
            name,
            description,
            isPrivate
        });
    }

    /**
     * 加入聊天室
     */
    public joinRoom(roomId: string): void {
        if (!this.connected) {
            console.error('无法加入聊天室: 未连接到服务器');
            return;
        }

        const room = this.rooms.find(r => r.id === roomId);
        console.log(`加入聊天室: ${room?.name || roomId}`);
        this.socket.emit(SocketEvents.ROOM_JOINED, { roomId });
    }

    /**
     * 离开聊天室
     */
    public leaveRoom(roomId: string): void {
        if (!this.connected) {
            console.error('无法离开聊天室: 未连接到服务器');
            return;
        }

        const room = this.rooms.find(r => r.id === roomId);
        console.log(`离开聊天室: ${room?.name || roomId}`);
        this.socket.emit(SocketEvents.ROOM_LEFT, { roomId });
    }

    /**
     * 发送系统消息
     */
    public sendSystemMessage(content: string): void {
        if (!this.connected) {
            console.error('无法发送消息: 未连接到服务器');
            return;
        }

        console.log(`发送系统消息: ${content}`);
        // 这里使用特定的系统消息事件，如果服务器支持的话
        this.socket.emit(SocketEvents.STSTEM_MESSAGE, {
            content,
            timestamp: Date.now()
        });
    }

    /**
     * 发送私聊消息
     */
    public sendPrivateMessage(recipientId: string, content: string): void {
        if (!this.connected) {
            console.error('无法发送消息: 未连接到服务器');
            return;
        }

        if (!this.isUserOnline(recipientId)) {
            console.error('用户不在线或不存在');
            return;
        }

        const recipient = this.connectedUsers.find(u => u.id === recipientId);
        console.log(`发送私聊消息到用户 ${recipient?.username || recipientId}: ${content}`);
        this.socket.emit(SocketEvents.MESSAGE_PRIVATE, {
            recipientId,
            content,
            timestamp: Date.now()
        });
    }

    /**
     * 发送房间消息
     */
    public sendRoomMessage(roomId: string, content: string): void {
        if (!this.connected) {
            console.error('无法发送消息: 未连接到服务器');
            return;
        }

        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            console.error('房间不存在');
            return;
        }

        console.log(`发送消息到聊天室 ${room.name}: ${content}`);
        this.socket.emit(SocketEvents.MESSAGE_ROOM, {
            roomId,
            content,
            timestamp: Date.now()
        });
    }

    /**
     * 断开连接
     */
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
            console.log('已断开与服务器的连接');
        }
    }

    /**
     * 检查用户是否在线
     */
    private isUserOnline(userId: string): boolean {
        return this.connectedUsers.some(u => u.id === userId);
    }

    /**
     * 获取连接的用户列表
     */
    public getConnectedUsers(): any[] {
        return [...this.connectedUsers];
    }

    /**
     * 获取可用聊天室列表
     */
    public getRooms(): any[] {
        return [...this.rooms];
    }
}

// 获取令牌并创建客户端
async function getAuthToken(): Promise<LoginResponse | null> {
    try {
        console.log('获取认证令牌...');
        const response = await fetch(`${AUTH_SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'user@example.com',
                password: 'password123'
            }),
        });

        if (!response.ok) {
            console.error(`认证失败: ${response.statusText}`);
            return null;
        }

        const data = await response.json() as LoginResponse;
        console.log('成功获取令牌');
        return data;
    } catch (error) {
        console.error('获取令牌时出错:', error instanceof Error ? error.message : String(error));
        return null;
    }
}

// 演示使用
async function runDemo() {
    console.log('===== 启动已认证客户端演示 =====');

    // 获取认证令牌
    const authData = await getAuthToken();

    if (!authData) {
        console.error('无法获取认证令牌，演示结束');
        process.exit(1);
        return;
    }

    // 创建并连接已认证客户端，开启调试模式
    const client = new AuthenticatedClient(authData.token, authData.user, true);
    client.connect();

    // 30秒后结束演示
    setTimeout(() => {
        console.log('演示结束');
        client.disconnect();
        process.exit(0);
    }, 30000);
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

// 仅当直接运行此文件时执行演示
if (require.main === module) {
    runDemo().catch(err => {
        console.error('演示运行错误:', err);
        process.exit(1);
    });
}

export default AuthenticatedClient; 