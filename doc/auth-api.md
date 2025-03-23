# 用户认证 API 文档

本文档描述了即时通信服务器的用户认证 API。所有的认证相关操作都通过这些 API 端点完成。

## 基础信息

- **基础URL**: `http://your-server-address/api/auth`
- **内容类型**: 所有请求和响应都使用 JSON 格式

## API 端点

### 1. 用户注册

**URL**: `/register`  
**方法**: `POST`  
**描述**: 创建新用户账户  

**请求体**:
```json
{
  "username": "用户名",
  "email": "user@example.com",
  "password": "安全密码"
}
```

**成功响应** (201 Created):
```json
{
  "user": {
    "id": "用户ID",
    "username": "用户名",
    "email": "user@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "token": "JWT令牌"
}
```

**错误响应** (400 Bad Request):
```json
{
  "message": "该邮箱已被注册"
}
```

### 2. 用户登录

**URL**: `/login`  
**方法**: `POST`  
**描述**: 用户使用邮箱和密码登录  

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "用户密码"
}
```

**成功响应** (200 OK):
```json
{
  "user": {
    "id": "用户ID",
    "username": "用户名",
    "email": "user@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "token": "JWT令牌"
}
```

**错误响应** (401 Unauthorized):
```json
{
  "message": "邮箱或密码不正确"
}
```

### 3. 刷新令牌

**URL**: `/refresh`  
**方法**: `POST`  
**描述**: 使用旧令牌获取新的访问令牌  

**请求体**:
```json
{
  "token": "当前JWT令牌"
}
```

**成功响应** (200 OK):
```json
{
  "user": {
    "id": "用户ID",
    "username": "用户名",
    "email": "user@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "token": "新的JWT令牌"
}
```

**错误响应** (401 Unauthorized):
```json
{
  "message": "无效的令牌"
}
```

### 4. 获取用户信息

**URL**: `/profile`  
**方法**: `GET`  
**描述**: 获取当前认证用户的信息  
**认证要求**: 请求头中需要包含有效的JWT令牌

**请求头**:
```
Authorization: Bearer JWT令牌
```

**成功响应** (200 OK):
```json
{
  "id": "用户ID",
  "username": "用户名",
  "email": "user@example.com",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**错误响应** (401 Unauthorized):
```json
{
  "message": "认证失败"
}
```

### 5. 验证令牌

**URL**: `/validate`  
**方法**: `POST`  
**描述**: 验证JWT令牌的有效性  

**请求体**:
```json
{
  "token": "JWT令牌"
}
```

**成功响应** (200 OK，令牌有效):
```json
{
  "valid": true,
  "user": {
    "id": "用户ID",
    "username": "用户名",
    "email": "user@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**成功响应** (200 OK，令牌无效):
```json
{
  "valid": false,
  "message": "无效的令牌"
}
```

## Socket.IO 认证

要在 Socket.IO 连接中使用认证，客户端应在连接选项中提供令牌：

```javascript
const socket = io('http://your-server-address', {
  auth: {
    token: 'JWT令牌'
  }
});

// 处理认证错误
socket.on('connect_error', (error) => {
  console.error('认证失败:', error.message);
});
```

成功认证后，服务器将允许客户端发送和接收消息、创建和加入聊天室等操作。 