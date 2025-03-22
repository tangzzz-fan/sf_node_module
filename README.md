# sf_node_module - TypeScript WebSocket 即时通信服务器

这是一个基于 Socket.IO 和 TypeScript 构建的强大、可扩展的即时通信服务器，遵循 WebSocket 最佳实践，并提供完整的测试覆盖。

## 功能特性

- 🚀 基于 Socket.IO 提供可靠的实时通信
- 🔒 支持用户认证和权限管理
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
- Winston (日志)
- Jest (测试)

## 安装
```bash
# 克隆仓库
git clone https://github.com/yourusername/sf_node_module.git
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