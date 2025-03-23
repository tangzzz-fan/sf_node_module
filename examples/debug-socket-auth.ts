/**
 * Socket.IO认证调试脚本
 * 用于分析JWT令牌认证过程中的问题
 */

import { io } from 'socket.io-client';
import { login } from './auth-client';

async function debugSocketAuth() {
    try {
        console.log('===== Socket.IO认证调试工具 =====');

        // 1. 获取令牌
        console.log('步骤1: 获取JWT令牌...');
        const token = await login('user@example.com', 'password123');
        console.log(`令牌获取成功: ${token.substring(0, 20)}...`);

        // 2. 解码令牌（不验证签名）
        console.log('\n步骤2: 解析令牌内容...');
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new Error('无效的JWT格式');
        }

        const header = JSON.parse(atob(tokenParts[0]));
        const payload = JSON.parse(atob(tokenParts[1]));

        console.log('令牌头部:', header);
        console.log('令牌载荷:', payload);
        console.log(`有效期至: ${new Date(payload.exp * 1000).toLocaleString()}`);

        // 3. 尝试连接Socket.IO服务器
        console.log('\n步骤3: 连接Socket.IO服务器...');
        const socket = io('http://localhost:6000', {
            auth: {
                token: token
            },
            transports: ['websocket'],
            reconnection: false // 关闭自动重连以便清晰观察问题
        });

        // 设置连接监听器
        socket.on('connect', () => {
            console.log('✅ 连接成功！Socket ID:', socket.id);

            // 5秒后断开连接
            setTimeout(() => {
                socket.disconnect();
                console.log('已断开连接');
            }, 5000);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ 连接错误:', error.message);

            if (error.message.includes('认证失败') || error.message.includes('auth')) {
                console.log('\n===== 可能的解决方案 =====');
                console.log('1. 确认HTTP和Socket.IO服务使用相同的JWT密钥');
                console.log('2. 检查服务器日志，寻找更详细的错误信息');
                console.log('3. 验证Socket认证中间件实现是否正确');
            }

            socket.disconnect();
        });

    } catch (error) {
        console.error('调试过程中发生错误:', error instanceof Error ? error.message : String(error));
    }
}

// 运行调试函数
debugSocketAuth();

// 帮助解码base64
function atob(str: string): string {
    return Buffer.from(str, 'base64').toString('binary');
} 