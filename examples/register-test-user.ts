/**
 * 注册测试用户脚本
 * 用于在系统中创建测试账户以进行认证测试
 */

// 为注册响应定义接口
interface RegisterResponse {
    token: string;
    user: {
        userId: string;
        email: string;
        username: string;
    };
}

async function registerTestUser() {
    try {
        console.log('正在注册测试用户...');

        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'user@example.com',
                password: 'password123',
                username: 'testuser'
            }),
        });

        // 使用类型断言处理响应数据
        const data = await response.json() as RegisterResponse;

        if (!response.ok) {
            console.error(`注册失败: ${response.statusText}`);
            console.error('错误详情:', data);
            return;
        }

        console.log('测试用户注册成功!');
        console.log('用户信息:', data.user);
        console.log('令牌:', data.token);
        console.log('您现在可以使用 auth-client.ts 进行登录测试');
    } catch (error) {
        console.error('注册过程中发生错误:', error instanceof Error ? error.message : String(error));
    }
}

// 运行注册函数
registerTestUser(); 