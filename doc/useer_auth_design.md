# 用户身份认证模块架构设计文档

## 1. 设计目标

设计一个完整的用户身份认证模块，需要满足以下需求：

- 支持用户通过邮箱和密码进行登录/注册
- 实现JWT令牌认证机制
- 支持HTTP API请求的认证
- **重点**：支持Socket.IO连接的用户认证
- 允许已认证用户创建聊天室、参与聊天等操作
- 遵循CLEAN和SOLID设计原则

## 2. 系统架构

### 2.1 模块组成

我们将认证模块划分为以下几个主要部分：
```
auth/
├── types.ts // 类型定义
├── auth.utils.ts // 工具函数（JWT处理、密码加密）
├── auth.service.ts // 认证核心服务
├── auth.middleware.ts // HTTP请求认证中间件
├── socket.auth.ts // Socket.IO认证中间件（新增）
└── index.ts // 模块导出
```

### 2.2 核心组件职责

#### 2.2.1 类型定义 (types.ts)

定义系统中使用的所有用户和认证相关的数据结构：
- `User`: 用户模型
- `RegisterUserDto`: 注册数据传输对象
- `LoginUserDto`: 登录数据传输对象
- `JwtPayload`: JWT令牌载荷
- `AuthResponse`: 认证响应

#### 2.2.2 工具函数 (auth.utils.ts)

提供与认证相关的纯函数工具：
- `generateToken`: 生成JWT令牌
- `verifyToken`: 验证JWT令牌
- `hashPassword`: 密码加密
- `comparePasswords`: 密码比对

#### 2.2.3 认证服务 (auth.service.ts)

封装所有认证业务逻辑：
- `register`: 用户注册
- `login`: 用户登录
- `getCurrentUser`: 获取当前用户信息
- `validateToken`: 验证令牌有效性

#### 2.2.4 HTTP认证中间件 (auth.middleware.ts)

处理HTTP请求的认证：
- `authenticate`: 验证请求中的令牌并附加用户信息

#### 2.2.5 Socket.IO认证中间件 (socket.auth.ts) [新增]

处理Socket.IO连接的认证：
- `authenticateSocket`: 验证Socket连接的令牌
- `requireAuth`: 保护需要认证的Socket事件

## 3. 详细设计

### 3.1 Socket.IO认证流程

对于Socket.IO连接，认证流程设计如下：

1. **连接验证**：客户端在建立Socket连接时附加令牌
   ```javascript
   // 客户端代码
   const socket = io('http://server-url', {
     auth: {
       token: 'jwt-token-here'
     }
   });
   ```

2. **中间件验证**：服务器使用中间件验证令牌
   ```typescript
   // 服务器代码
   io.use(authenticateSocket);
   ```

3. **认证状态存储**：将认证用户信息存储在Socket连接中
   ```typescript
   socket.data.user = decodedUser;
   ```

4. **事件保护**：为需要认证的Socket事件提供保护机制
   ```typescript
   socket.on('create_room', requireAuth((data) => {
     // 创建聊天室的逻辑
   }));
   ```

### 3.2 聊天室权限控制

1. **聊天室创建**：只有认证用户可创建聊天室
2. **聊天室访问**：根据聊天室设置控制访问权限
3. **消息发送**：确保只有认证用户可发送消息
4. **用户管理**：管理聊天室内的用户权限

## 4. SOLID原则应用

- **单一职责原则(S)**：每个类/文件只有一个职责
  - `auth.service.ts` 只处理认证业务逻辑
  - `auth.utils.ts` 只提供工具函数
  - `socket.auth.ts` 专注于Socket认证

- **开放/封闭原则(O)**：模块可扩展但不需修改
  - 认证流程设计为可扩展的中间件系统
  - 易于添加新的认证方式（如OAuth）

- **里氏替换原则(L)**：通过接口定义确保一致行为
  - 所有认证结果遵循相同的响应格式

- **接口隔离原则(I)**：定义精确的接口
  - 数据传输对象精确定义所需字段
  - 避免过度依赖

- **依赖倒置原则(D)**：依赖抽象而非具体实现
  - 服务与中间件通过接口通信
  - 允许轻松替换实现（如数据存储方式）

## 5. 实现要点

### 5.1 Socket.IO认证中间件设计

```typescript
// socket.auth.ts
import { Socket } from 'socket.io';
import { verifyToken } from './auth.utils';
import { ExtendedError } from 'socket.io/dist/namespace';
export interface AuthenticatedSocket extends Socket {
user?: {
userId: string;
email: string;
username: string;
};
}
// Socket.IO认证中间件
export const authenticateSocket = (
socket: AuthenticatedSocket,
next: (err?: ExtendedError) => void
) => {
const token = socket.handshake.auth.token;
if (!token) {
return next(new Error('认证失败：令牌未提供'));
}
try {
const decoded = verifyToken(token);
socket.user = {
userId: decoded.userId,
email: decoded.email,
username: decoded.username
};
next();
} catch (error) {
next(new Error('认证失败：无效令牌'));
}
};
// 保护需要认证的Socket事件处理函数
export const requireAuth = (handler: Function) => {
return (data: any, callback?: Function) => {
const socket = this as AuthenticatedSocket;
if (!socket.user) {
if (callback) {
callback({ error: '未授权：需要认证' });
}
return;
}
return handler.call(socket, data, callback);
};
};
```

### 5.2 集成Socket.IO与认证系统

```typescript
// 服务器初始化代码示例
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { authenticate } from './auth/auth.middleware';
import { authenticateSocket } from './auth/socket.auth';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// HTTP认证路由
app.post('/auth/login', ...);
app.post('/auth/register', ...);
app.get('/profile', authenticate, ...);

// Socket.IO认证
io.use(authenticateSocket);

// 聊天室相关事件
io.on('connection', (socket) => {
  socket.on('create_room', requireAuth((data) => {
    // 创建聊天室逻辑
  }));
  
  socket.on('join_room', requireAuth((data) => {
    // 加入聊天室逻辑
  }));
  
  socket.on('send_message', requireAuth((data) => {
    // 发送消息逻辑
  }));
});

server.listen(3000);
```

## 6. 优势与特点

1. **完全分离的关注点**：HTTP认证和Socket.IO认证虽然共享核心逻辑，但实现分离
2. **可测试性强**：每个组件可独立测试
3. **灵活性高**：易于扩展新的认证方法或调整认证流程
4. **代码复用**：核心认证逻辑在HTTP和Socket.IO之间共享
5. **安全性**：统一的令牌验证和过期处理

## 7. 潜在挑战与解决方案

1. **令牌过期处理**
   - 解决方案：实现令牌刷新机制，或在Socket连接中监听令牌过期事件

2. **连接状态管理**
   - 解决方案：维护用户ID与Socket连接的映射，处理断线重连

3. **性能考虑**
   - 解决方案：缓存已验证令牌，减少频繁验证操作

## 8. 总结

本设计文档提供了一个符合CLEAN和SOLID原则的用户认证系统架构，特别关注Socket.IO连接的认证。通过合理划分职责和定义清晰的接口，该系统能够满足当前的HTTP和Socket.IO认证需求，同时保持足够的灵活性以适应未来的扩展。
