# Socket.IO 即时通信服务器 API 文档

## 概述

本文档详细说明了基于 Socket.IO 实现的即时通信服务器的接口使用方法。该服务器支持私聊、群聊、房间管理等功能。

## 连接与认证

### 连接服务器
客户端需要在连接时提供认证信息：

```javascript
const socket = io('http://your-server-address', {
  auth: {
    username: '用户名' // 必填项
  }
});
```

**说明**：
- 服务器会为每个连接的用户自动生成一个 UUID 作为 userId
- 实际应用中应该扩展为使用 JWT 或其他认证令牌

## 事件列表

### 1. 私聊消息

**事件名称**：`message_private`

**功能**：向指定用户发送私聊消息

**参数**：
```javascript
{
  recipientId: string,  // 接收者ID
  content: string,      // 消息内容
  timestamp?: number    // 可选，消息时间戳
}
```

**示例**：
```javascript
socket.emit('message_private', {
  recipientId: '接收者ID',
  content: '你好！这是一条私信',
  timestamp: Date.now()
});
```

### 2. 房间消息

**事件名称**：`message_room`

**功能**：向指定房间发送消息

**参数**：
```javascript
{
  roomId: string,       // 房间ID
  content: string,      // 消息内容
  timestamp?: number    // 可选，消息时间戳
}
```

**示例**：
```javascript
socket.emit('message_room', {
  roomId: '房间ID',
  content: '大家好！这是一条群聊消息',
  timestamp: Date.now()
});
```

### 3. 标记消息已读

**事件名称**：`message_read`

**功能**：标记指定消息为已读状态

**参数**：`string` - 消息ID

**示例**：
```javascript
socket.emit('message_read', 'message-123');
```

### 4. 加入房间

**事件名称**：`room_joined`

**功能**：加入指定的聊天房间

**参数**：
```javascript
{
  roomId: string  // 房间ID
}
```

**示例**：
```javascript
socket.emit('room_joined', {
  roomId: '房间ID'
});
```

### 5. 离开房间

**事件名称**：`room_left`

**功能**：离开指定的聊天房间

**参数**：
```javascript
{
  roomId: string  // 房间ID
}
```

**示例**：
```javascript
socket.emit('room_left', {
  roomId: '房间ID'
});
```

### 6. 创建房间

**事件名称**：`room_created`

**功能**：创建一个新的聊天房间

**参数**：
```javascript
{
  roomName: string,       // 房间名称
  isPrivate?: boolean,    // 可选，是否为私有房间
  members?: string[]      // 可选，初始成员ID列表
}
```

**示例**：
```javascript
socket.emit('room_created', {
  roomName: '技术讨论组',
  isPrivate: false,
  members: ['user1', 'user2']
});
```

## 服务端推送事件

以下是服务端可能推送给客户端的事件，客户端需要监听这些事件：

### 1. 接收私聊消息

**事件名称**：`receive_private_message`

**数据格式**：
```javascript
{
  id: string,           // 消息ID
  senderId: string,     // 发送者ID
  senderName: string,   // 发送者名称
  content: string,      // 消息内容
  timestamp: number     // 消息时间戳
}
```

**监听示例**：
```javascript
socket.on('receive_private_message', (message) => {
  console.log(`收到来自 ${message.senderName} 的私信: ${message.content}`);
});
```

### 2. 接收房间消息

**事件名称**：`receive_room_message`

**数据格式**：
```javascript
{
  id: string,           // 消息ID
  roomId: string,       // 房间ID
  senderId: string,     // 发送者ID
  senderName: string,   // 发送者名称
  content: string,      // 消息内容
  timestamp: number     // 消息时间戳
}
```

**监听示例**：
```javascript
socket.on('receive_room_message', (message) => {
  console.log(`收到房间 ${message.roomId} 的消息: ${message.content}`);
});
```

### 3. 用户上线通知

**事件名称**：`user_connected`

**数据格式**：
```javascript
{
  userId: string,       // 用户ID
  username: string      // 用户名
}
```

### 4. 用户离线通知

**事件名称**：`user_disconnected`

**数据格式**：
```javascript
{
  userId: string,       // 用户ID
  username: string      // 用户名
}
```

## 错误处理

### 错误事件

服务器会在出现问题时触发错误事件：

**事件名称**：`error`

**监听示例**：
```javascript
socket.on('error', (error) => {
  console.error('Socket 错误:', error.message);
});
```

## 最佳实践

1. 始终处理连接错误和重连
2. 实现消息发送失败后的重试机制
3. 在UI中提供消息发送状态指示
4. 实现消息本地缓存，提高离线体验
5. 在敏感操作前验证用户权限

## 示例应用流程

1. 连接并认证
2. 获取在线用户列表和可用房间
3. 加入感兴趣的房间
4. 发送和接收消息
5. 适当处理连接中断和重连


