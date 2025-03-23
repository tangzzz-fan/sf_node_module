import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config';

// 自定义JWT载荷接口，确保包含我们需要的字段
export interface JWTPayload {
    userId: string;
    email: string;
    username: string;
    [key: string]: any; // 允许其他可能的字段
}

/**
 * 生成JWT令牌
 * @param payload 令牌载荷
 * @returns 生成的JWT令牌
 */
export const generateToken = (payload: JWTPayload): string => {
    if (!config.jwtSecret) {
        console.error("Error: config.jwtSecret is empty!");
        throw new Error("JWT Secret is missing!");
    }

    const secretKey: Secret = config.jwtSecret;
    const options = {
        expiresIn: config.jwtExpiresIn
    } as SignOptions;

    return jwt.sign(payload, secretKey, options);
};

/**
 * 验证JWT令牌
 * @param token JWT令牌
 * @returns 解码后的载荷或null（如果令牌无效）
 */
export const verifyToken = (token: string): JWTPayload | null => {
    try {
        const secretKey: Secret = config.jwtSecret || '';
        return jwt.verify(token, secretKey) as JWTPayload;
    } catch (error) {
        return null;
    }
};

/**
 * 密码加密
 * @param password 明文密码
 * @returns 加密后的密码哈希
 */
export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
};

/**
 * 密码比对
 * @param password 明文密码
 * @param hash 加密后的密码哈希
 * @returns 密码是否匹配
 */
export const comparePasswords = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * 从请求头中提取令牌
 * @param authHeader 认证头
 * @returns 提取的令牌或null
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.substring(7); // 移除 'Bearer ' 前缀
};