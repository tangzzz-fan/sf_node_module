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
/
├── src/ # 源代码
│ ├── auth/ # 用户认证模块
│ │ ├── controllers/ # 认证控制器
│ │ ├── middleware/ # 认证中间件
│ │ ├── services/ # 认证服务
│ │ └── repository/ # 用户数据访问层
│ ├── controllers/ # 控制器
│ ├── middleware/ # Express 中间件
│ ├── services/ # 服务逻辑
│ ├── socket/ # Socket.IO 处理器
│ ├── tests/ # 测试文件
│ ├── types/ # TypeScript 类型定义
│ ├── utils/ # 工具函数
│ ├── config.ts # 配置
│ ├── index.ts # 入口文件
│ └── server.ts # 服务器设置
├── dist/ # 编译后的 JavaScript 代码
├── logs/ # 日志文件
├── .env.example # 环境变量示例
├── package.json # npm 配置
├── tsconfig.json # TypeScript 配置
└── jest.config.js # Jest 测试配置
```

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

请参考 `examples` 目录中的客户端示例代码。

## 错误处理

服务器包含完善的错误处理机制，包括：

1. 未捕获异常处理
2. 请求超时处理
3. API错误统一响应
4. WebSocket错误事件处理
5. 重连机制

## 贡献

欢迎贡献！请提交 Pull Requests 或创建 Issues 来讨论功能和修复。

## 许可证

MIT