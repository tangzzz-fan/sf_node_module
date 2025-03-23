import { AuthService } from './auth.service';
import { authenticate, optionalAuthenticate } from './auth.middleware';
import { authenticateSocket, requireAuth } from './socket.auth';
import * as authUtils from './auth.utils';
import * as authTypes from './types';

export {
    // 服务
    AuthService,

    // 中间件
    authenticate,
    optionalAuthenticate,
    authenticateSocket,
    requireAuth,

    // 工具函数
    authUtils,

    // 类型
    authTypes
};