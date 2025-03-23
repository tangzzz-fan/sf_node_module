# sf_node_module - TypeScript WebSocket 即时通信服务器

这是一个基于 Socket.IO 和 TypeScript 构建的强大、可扩展的即时通信服务器，遵循 WebSocket 最佳实践，并提供完整的测试覆盖。

## 功能特性

- 🚀 基于 Socket.IO 提供可靠的实时通信
- 🔒 支持用户认证和权限管理
  - 邮箱密码登录系统
  - JWT 令牌认证
  - Socket.IO 连接认证
  - 用户权限控制
- 💬 私人消息和群组聊天功能
- 🏠 创建和管理聊天室
- 📱 离线消息存储和检索
- ✅ 消息已读状态跟踪
- 📝 完整的类型定义和文档
- 🧪 全面的单元测试和集成测试

## 技术栈

- TypeScript
- Node.js
- Socket.IO
- Express
- JWT (JSON Web Tokens)
- bcrypt (密码加密)
- Winston (日志)
- Jest (测试)

## 安装
```bash
# 克隆仓库
git clone git@github.com:tangzzz-fan/sf_node_module.git
# 进入项目目录
cd sf_node_module
# 安装依赖
npm install
# 复制环境变量示例文件
cp .env.example .env
# 编译 TypeScript
npm run build
```

## 使用
### 启动服务器
```bash
# 开发模式（自动重启）
npm run dev
# 生产模式
npm run build
npm start
```
### 运行测试
```bash
# 运行所有测试
npm test
# 监听模式下运行测试
npm run test:watch
```

## 项目结构
```
README.md
/
├── src/ # 源代码
│ ├── auth/ # 用户认证模块
│ │ ├── controllers/ # 认证控制器
│ │ ├── middleware/ # 认证中间件
│ │ ├── services/ # 认证服务
│ │ └── repository/ # 用户数据访问层
│ ├── controllers/ # 控制器
│ │ └── SocketController.ts # Socket事件处理控制器
│ ├── middleware/ # Express 中间件
│ ├── services/ # 服务逻辑
│ ├── socket/ # Socket.IO 处理器
│ │ └── index.ts # Socket连接和事件管理
│ ├── tests/ # 测试文件
│ ├── types/ # TypeScript 类型定义
│ │ └── index.ts # 核心类型声明
│ ├── utils/ # 工具函数
│ │ └── logger.ts # 日志工具
│ ├── config.ts # 配置
│ ├── index.ts # 入口文件
│ └── server.ts # 服务器设置
├── dist/ # 编译后的 JavaScript 代码
├── logs/ # 日志文件
├── examples/ # 客户端使用示例
│ ├── client.ts # 基础客户端示例
│ ├── client_with_token.ts # 带认证令牌的客户端示例
│ ├── client_without_token.ts # 无认证令牌客户端示例
│ ├── auth-client.ts # 认证流程客户端示例
│ └── register-test-user.ts # 用户注册测试工具
├── .env.example # 环境变量示例
├── package.json # npm 配置
├── tsconfig.json # TypeScript 配置
└── jest.config.js # Jest 测试配置
```

## 系统架构

本项目采用分层架构设计，遵循SOLID原则，各层职责明确：

1. **表示层**：Express路由和Socket.IO事件处理
2. **控制器层**：处理请求/事件，调用相应服务
3. **服务层**：实现业务逻辑
4. **数据访问层**：处理与数据存储的交互

### 核心组件

- **Server.ts**：HTTP和WebSocket服务器初始化
- **Socket/index.ts**：Socket.IO连接管理和事件路由
- **SocketController.ts**：处理不同类型的Socket事件
- **Logger.ts**：基于Winston的日志记录系统

## 认证系统
服务器提供完整的用户认证系统，支持：

1. **用户注册**: 创建新用户账户
2. **用户登录**: 使用邮箱和密码登录
3. **JWT 认证**: 生成和验证 JSON Web Tokens
4. **Socket.IO 认证**: 确保只有认证用户可以建立 WebSocket 连接
5. **权限控制**: 基于用户角色的权限管理

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/register` | POST | 注册新用户 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/refresh` | POST | 刷新访问令牌 |
| `/api/auth/password-reset` | POST | 请求密码重置 |

### Socket.IO 认证示例

客户端连接时需要提供认证令牌：

```javascript
// 客户端连接示例
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token_here'
  }
});

// 处理认证错误
socket.on('connect_error', (error) => {
  console.error('连接错误:', error.message);
});
```

## 客户端使用示例

项目提供了多种客户端示例，位于`examples`目录：

### 基础客户端使用 (examples/client.ts)
```typescript
// 基础Socket.IO连接示例
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('已连接到服务器');
  
  // 发送消息示例
  socket.emit('message', { 
    content: '你好，世界!', 
    room: 'general' 
  });
});

// 接收消息
socket.on('message', (data) => {
  console.log('收到消息:', data);
});
```

### 带认证的客户端 (examples/client_with_token.ts)
首先需要获取JWT令牌，然后才能建立Socket连接：

1. 使用`examples/register-test-user.ts`注册测试用户
2. 使用`examples/auth-client.ts`获取JWT令牌
3. 使用获取的令牌建立Socket连接

### 使用示例流程

1. **注册用户**
```bash
# 运行注册测试用户脚本
ts-node examples/register-test-user.ts
```

2. **登录获取令牌**
```bash
# 运行认证客户端获取JWT令牌
ts-node examples/auth-client.ts
```

3. **使用令牌建立WebSocket连接**
```bash
# 使用令牌建立连接
TOKEN=your_jwt_token ts-node examples/client_with_token.ts
```

## 扩展指南

### 添加新的Socket事件

1. 在`src/types/index.ts`中定义新事件类型
2. 在`src/controllers/SocketController.ts`中添加事件处理方法
3. 在`src/socket/index.ts`中注册新事件

### 示例：添加"用户输入中"事件
```typescript
// 在types/index.ts中添加类型
interface TypingEvent {
  user: string;
  room: string;
  isTyping: boolean;
}

// 在SocketController.ts中添加处理方法
handleTyping(socket: Socket, data: TypingEvent): void {
  // 广播给房间内其他用户
  socket.to(data.room).emit('typing', {
    user: data.user,
    isTyping: data.isTyping
  });
}

// 在socket/index.ts中注册事件
socket.on('typing', (data) => socketController.handleTyping(socket, data));
```

## 错误处理

服务器包含完善的错误处理机制，包括：

1. 未捕获异常处理
2. 请求超时处理
3. API错误统一响应
4. WebSocket错误事件处理
5. 重连机制

### 日志系统

项目使用Winston记录日志，支持不同级别的日志和文件轮转：

```typescript
// 使用日志工具示例
import logger from '../utils/logger';

logger.info('服务器启动成功');
logger.error('发生错误', { error });
logger.debug('调试信息', { data });
```

## 贡献

欢迎贡献！请提交 Pull Requests 或创建 Issues 来讨论功能和修复。

## 许可证

MIT

## 部署指南

### Docker部署
项目支持Docker容器化部署：

```bash
# 构建Docker镜像
docker build -t sf-node-module .

# 运行容器
docker run -p 3000:3000 --env-file .env sf-node-module
```

### 生产环境注意事项
1. 确保设置了正确的环境变量
2. 建议使用PM2或类似工具管理Node.js进程
3. 配置反向代理(如Nginx)以处理SSL和负载均衡
4. 考虑使用Redis适配器支持多服务器实例的Socket.IO集群

## 性能优化
- 使用Redis适配器支持水平扩展
- 实现消息队列处理大量并发连接
- 使用适当的日志级别，生产环境避免过多调试日志
- 定期清理过期的离线消息和断开的连接

## 常见问题解答

**Q: 如何处理大量并发连接?**  
A: 建议使用Socket.IO的Redis适配器并水平扩展服务器实例。

**Q: 如何确保消息传递的可靠性?**  
A: 系统实现了消息确认机制和离线消息存储，确保消息不会丢失。

**Q: 如何自定义用户认证流程?**  
A: 修改`src/auth/services`目录下的认证服务，实现自定义认证逻辑。

