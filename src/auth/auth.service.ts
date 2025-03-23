import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { generateToken, hashPassword, comparePasswords, verifyToken, JWTPayload } from './auth.utils';
import { RegisterUserDto, LoginUserDto, AuthResponse, AuthenticatedUser } from './types';
import { config } from '../config';

// 模拟数据库存储
interface UserRecord {
    id: string;
    email: string;
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export class AuthService {
    private users: Map<string, UserRecord> = new Map();

    constructor() {
        // 在开发环境下添加测试用户
        if (config.nodeEnv === 'development') {
            this.addTestUser();
        }
    }

    // 添加测试用户方法
    private async addTestUser() {
        try {
            // 检查测试用户是否已存在
            const existingUser = this.findUserByEmail('user@example.com');
            if (existingUser) {
                return; // 用户已存在，无需重复添加
            }

            // 创建测试用户
            const hashedPassword = await hashPassword('password123');
            const userId = uuidv4(); // 假设使用uuid生成ID

            const testUser: UserRecord = {
                id: userId,
                email: 'user@example.com',
                username: 'testuser',
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.users.set(userId, testUser);
            logger.info('已添加测试用户: user@example.com');
        } catch (error) {
            logger.error('添加测试用户失败:', error);
        }
    }

    /**
     * 用户注册
     * @param userData 注册数据
     * @returns 认证响应（包含令牌和用户信息）
     */
    public async register(userData: RegisterUserDto): Promise<AuthResponse> {
        // 检查邮箱是否已存在
        const existingUser = this.findUserByEmail(userData.email);
        if (existingUser) {
            throw new Error('邮箱已被注册');
        }

        // 检查用户名是否已存在
        const existingUsername = this.findUserByUsername(userData.username);
        if (existingUsername) {
            throw new Error('用户名已被使用');
        }

        // 创建新用户
        const userId = uuidv4();
        const hashedPassword = await hashPassword(userData.password);

        const newUser: UserRecord = {
            id: userId,
            email: userData.email,
            username: userData.username,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 保存用户
        this.users.set(userId, newUser);
        logger.info(`用户注册成功: ${userData.username} (${userData.email})`);

        // 生成令牌
        const payload: JWTPayload = {
            userId: newUser.id,
            email: newUser.email,
            username: newUser.username
        };

        const token = generateToken(payload);

        return {
            token,
            user: {
                userId: newUser.id,
                email: newUser.email,
                username: newUser.username
            }
        };
    }

    /**
     * 用户登录
     * @param loginData 登录数据
     * @returns 认证响应（包含令牌和用户信息）
     */
    public async login(loginData: LoginUserDto): Promise<AuthResponse> {
        // 查找用户
        const user = this.findUserByEmail(loginData.email);
        if (!user) {
            throw new Error('邮箱或密码不正确');
        }

        // 验证密码
        const isPasswordValid = await comparePasswords(loginData.password, user.password);
        if (!isPasswordValid) {
            throw new Error('邮箱或密码不正确');
        }

        logger.info(`用户登录成功: ${user.username} (${user.email})`);

        // 生成令牌
        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            username: user.username
        };

        const token = generateToken(payload);

        return {
            token,
            user: {
                userId: user.id,
                email: user.email,
                username: user.username
            }
        };
    }

    /**
     * 验证令牌并返回用户信息
     * @param token JWT令牌
     * @returns 认证用户信息或null
     */
    public validateToken(token: string): AuthenticatedUser | null {
        const payload = verifyToken(token);
        if (!payload) {
            return null;
        }

        const user = this.findUserById(payload.userId);
        if (!user) {
            return null;
        }

        return {
            userId: user.id,
            email: user.email,
            username: user.username
        };
    }

    /**
     * 通过ID查找用户
     * @param id 用户ID
     * @returns 用户记录或undefined
     */
    private findUserById(id: string): UserRecord | undefined {
        return this.users.get(id);
    }

    /**
     * 通过邮箱查找用户
     * @param email 用户邮箱
     * @returns 用户记录或undefined
     */
    private findUserByEmail(email: string): UserRecord | undefined {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return undefined;
    }

    /**
     * 通过用户名查找用户
     * @param username 用户名
     * @returns 用户记录或undefined
     */
    private findUserByUsername(username: string): UserRecord | undefined {
        for (const user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }
        return undefined;
    }
}