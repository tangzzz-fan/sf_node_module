/**
 * 认证客户端示例
 * 演示如何使用JWT令牌进行Socket.IO连接认证
 */

import { io } from 'socket.io-client';

// 为登录响应定义接口
interface LoginResponse {
    token: string;
    user: {
        userId: string;
        email: string;
        username: string;
    };
}

// 模拟登录过程获取令牌
async function login(email: string, password: string): Promise<string> {
    try {
        // 确保路径正确（注意可能的 /api 前缀）
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`登录失败: ${response.statusText} - ${errorText}`);
        }

        // 使用类型断言处理响应数据
        const data = await response.json() as LoginResponse;

        // 确保token存在
        if (!data.token) {
            throw new Error('服务器响应中没有找到token');
        }

        console.log('登录成功，获取到用户信息:', data.user);
        return data.token;
    } catch (error) {
        console.error('登录错误:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}

/**
 * Socket.IO认证客户端演示类
 */
class AuthenticatedClient {
    private socket: any;
    private token: string | null = null;

    /**
     * 使用用户凭据进行认证
     * @param email 用户邮箱
     * @param password 用户密码
     * @returns 是否认证成功
     */
    public async authenticate(email: string, password: string): Promise<boolean> {
        try {
            this.token = await login(email, password);
            console.log('认证成功，已获取令牌');
            return true;
        } catch (error) {
            console.error('认证失败:', error instanceof Error ? error.message : String(error));
            return false;
        }
    }

    /**
     * 连接到Socket.IO服务器
     * @returns 是否连接成功
     */
    public connect(): boolean {
        if (!this.token) {
            console.error('错误: 在连接前必须先进行认证');
            return false;
        }

        // 使用令牌创建Socket.IO连接
        this.socket = io('http://localhost:6000', {
            auth: {
                token: this.token
            },
            transports: ['websocket']
        });

        // 设置事件监听器
        this.setupEventListeners();
        return true;
    }

    /**
     * 配置Socket.IO事件监听器
     */
    private setupEventListeners(): void {
        this.socket.on('connect', () => {
            console.log('已连接到服务器');
            console.log(`Socket ID: ${this.socket.id}`);
        });

        this.socket.on('connect_error', (error: any) => {
            console.error('连接错误:', error.message);
            // 特别处理认证错误
            if (error.message.includes('认证失败') || error.message.includes('auth')) {
                console.error('认证令牌可能无效或已过期');
            }
        });

        this.socket.on('disconnect', (reason: string) => {
            console.log(`断开连接: ${reason}`);
        });

        // 添加其他事件监听器...
    }

    /**
     * 断开连接
     */
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            console.log('已断开与服务器的连接');
        }
    }
}

// 演示使用
async function demo() {
    const client = new AuthenticatedClient();

    // 尝试认证
    console.log('尝试登录...');
    const isAuthenticated = await client.authenticate('user@example.com', 'password123');

    if (isAuthenticated) {
        console.log('认证成功，尝试连接到Socket.IO服务器...');
        const isConnected = client.connect();

        if (isConnected) {
            console.log('已成功建立认证连接');

            // 保持连接10秒钟，然后断开
            setTimeout(() => {
                client.disconnect();
                console.log('演示完成');
            }, 10000);
        }
    } else {
        console.log('认证失败，无法连接');
    }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
    console.log('启动认证客户端演示...');
    demo().catch(error => {
        console.error('演示运行错误:', error instanceof Error ? error.message : String(error));
    });
}

export { login, AuthenticatedClient };