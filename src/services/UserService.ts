import { User } from '../types';

/**
 * 用户服务类 - 管理用户状态
 */
export class UserService {
    private users: Map<string, User> = new Map();

    /**
     * 添加用户
     * @param user 用户对象
     * @returns 添加的用户对象
     */
    public addUser(user: User): User {
        this.users.set(user.userId, user);
        return user;
    }

    /**
     * 通过 ID 获取用户
     */
    public getUserById(userId: string): User | undefined {
        return this.users.get(userId);
    }

    /**
     * 通过 Socket ID 获取用户
     */
    public getUserBySocketId(socketId: string): User | undefined {
        for (const user of this.users.values()) {
            if (user.socketId === socketId) {
                return user;
            }
        }
        return undefined;
    }

    /**
     * 通过用户名获取用户
     */
    public getUserByUsername(username: string): User | undefined {
        for (const user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }
        return undefined;
    }

    /**
     * 获取所有用户
     * @returns 用户数组
     */
    public getAllUsers(): User[] {
        return Array.from(this.users.values());
    }

    /**
     * 更新用户信息
     * @param userId 用户ID
     * @param updates 需要更新的用户属性
     * @returns 更新后的用户对象或undefined
     */
    public updateUser(userId: string, updates: Partial<User>): User | undefined {
        const user = this.users.get(userId);
        if (!user) {
            return undefined;
        }

        // 合并更新
        const updatedUser = {
            ...user,
            ...updates
        };

        this.users.set(userId, updatedUser);
        return updatedUser;
    }

    /**
     * 移除用户
     * @param userId 用户ID
     * @returns 是否成功移除
     */
    public removeUser(userId: string): boolean {
        return this.users.delete(userId);
    }

    /**
     * 获取在线用户数
     */
    public getOnlineCount(): number {
        return this.users.size;
    }
} 