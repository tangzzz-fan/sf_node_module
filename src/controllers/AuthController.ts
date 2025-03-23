import { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { logger } from '../utils/logger';

export class AuthController {
    private authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    /**
     * 用户注册
     */
    public async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, username } = req.body;

            // 验证请求数据
            if (!email || !password || !username) {
                res.status(400).json({ message: '邮箱、密码和用户名都是必填项' });
                return;
            }

            // 调用认证服务进行注册
            const result = await this.authService.register({ email, password, username });

            // 返回结果
            res.status(201).json(result);
        } catch (error) {
            logger.error(`注册错误: ${error}`);

            // 处理特定错误
            if (error instanceof Error) {
                if (error.message.includes('邮箱已被注册') || error.message.includes('用户名已被使用')) {
                    res.status(409).json({ message: error.message });
                    return;
                }
            }

            // 通用错误处理
            res.status(500).json({ message: '注册过程中发生错误' });
        }
    }

    /**
     * 用户登录
     */
    public async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            // 验证请求数据
            if (!email || !password) {
                res.status(400).json({ message: '邮箱和密码都是必填项' });
                return;
            }

            // 调用认证服务进行登录
            const result = await this.authService.login({ email, password });

            // 返回结果
            res.status(200).json(result);
        } catch (error) {
            logger.error(`登录错误: ${error}`);

            // 处理特定错误
            if (error instanceof Error && error.message.includes('邮箱或密码不正确')) {
                res.status(401).json({ message: '邮箱或密码不正确' });
                return;
            }

            // 通用错误处理
            res.status(500).json({ message: '登录过程中发生错误' });
        }
    }

    /**
     * 获取当前用户信息
     */
    public getCurrentUser(req: Request, res: Response): void {
        try {
            // 用户信息已由认证中间件附加到请求对象
            if (!req.user) {
                res.status(401).json({ message: '未认证的请求' });
                return;
            }

            // 返回用户信息
            res.status(200).json({ user: req.user });
        } catch (error) {
            logger.error(`获取用户信息错误: ${error}`);
            res.status(500).json({ message: '获取用户信息过程中发生错误' });
        }
    }
}