/**
 * 无令牌客户端示例
 * 演示未认证情况下的错误处理
 */
import { io } from 'socket.io-client';
import { SocketEvents } from '../src/types';

// 服务器地址
const SOCKET_SERVER_URL = 'http://localhost:6000';

class UnauthenticatedClient {
    private socket: any;
    private connected: boolean = false;

    constructor() {
        console.log('创建未认证客户端实例');
    }

    /**
     * 尝试连接到Socket服务器（无令牌）
     */
    public connect(): void {
        console.log(`尝试无令牌连接到服务器: ${SOCKET_SERVER_URL}`);

        // 创建没有令牌的Socket连接
        this.socket = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000
        });

        // 注册事件监听器
        this.registerEventListeners();
    }

    /**
     * 注册Socket事件监听器
     */
    private registerEventListeners(): void {
        // 连接事件（预期会失败）
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('意外情况：连接成功，即使没有提供认证令牌');
            console.log(`Socket ID: ${this.socket.id}`);
        });

        // 连接错误处理（预期会发生）
        this.socket.on('connect_error', (error: any) => {
            console.error('❌ 连接错误:', error.message);

            if (error.message.includes('认证失败') || error.message.includes('auth')) {
                console.log('✓ 按预期收到认证错误（这是正确的行为）');
                console.log('解释：服务器拒绝了未经认证的连接请求');
            }

            // 在收到认证错误后尝试重新连接几次，然后放弃
            setTimeout(() => {
                if (!this.connected) {
                    console.log('放弃连接尝试，服务器需要有效的认证令牌');
                    this.disconnect();
                }
            }, 5000);
        });

        this.socket.on('disconnect', (reason: string) => {
            this.connected = false;
            console.log(`断开连接: ${reason}`);
        });

        // 错误处理
        this.socket.on('error', (error: any) => {
            console.error('Socket错误:', error);
        });
    }

    /**
     * 断开连接
     */
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
            console.log('已断开连接');
        }
    }
}

// 演示使用
function runDemo() {
    console.log('===== 启动未认证客户端演示 =====');
    console.log('这个演示展示了当未提供认证令牌时的错误处理');

    const client = new UnauthenticatedClient();
    client.connect();

    // 10秒后结束演示
    setTimeout(() => {
        console.log('演示结束');
        client.disconnect();
        process.exit(0);
    }, 10000);
}

// 仅当直接运行此文件时执行演示
if (require.main === module) {
    runDemo();
}

export default UnauthenticatedClient; 