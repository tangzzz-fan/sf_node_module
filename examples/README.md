# WebSocket客户端示例

这个示例展示了如何使用 Socket.IO 客户端连接到我们的即时通信服务器。

## 运行示例

确保你已经安装了所有依赖，并且服务器正在运行： 

```bash
cd ..
npm run dev
#新开一个终端运行客户端示例
cd examples
ts-node client.ts
```

## 示例功能

这个客户端示例实现了以下功能：

1. 连接到 WebSocket 服务器
2. 发送/接收私人消息
3. 创建聊天室
4. 加入/离开聊天室
5. 发送/接收房间消息
6. 显示在线用户列表
7. 显示可用聊天室列表

## 在你自己的应用中使用


```typescript
import ChatClient from './client';
// 创建一个新的聊天客户端实例
const client = new ChatClient('YourUsername');
// 发送私人消息
function sendMessage(userId, message) {
client.sendPrivateMessage(userId, message);
}
// 创建聊天室
function createNewRoom(name) {
client.createRoom(name);
}
// 在组件卸载时断开连接
function cleanup() {
client.disconnect();
}
```

## 自定义连接选项

如果需要自定义连接选项，可以修改 `client.ts` 中的 `io()` 调用：

```typescript
this.socket = io(SERVER_URL, {
  auth: {
    username: this.username,
    token: 'your-auth-token' // 添加JWT认证等
  },
  transports: ['websocket'], // 指定传输方式
  reconnection: true,        // 启用重连
  reconnectionAttempts: 5,   // 重连尝试次数
  timeout: 10000             // 连接超时时间
});
```

## 扩展功能

你可以扩展 `ChatClient` 类添加更多功能，如：

- 文件传输
- 消息加密
- 离线消息队列
- 已读回执管理
- 输入状态指示器
