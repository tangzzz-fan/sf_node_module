import express, { Application } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { UserService } from './services/UserService';
import { MessageService } from './services/MessageService';
import { SocketController } from './controllers/SocketController';
import { errorMiddleware } from './middleware/errorMiddleware';
import { registerSocketHandlers } from './socket';
import { logger } from './utils/logger';

export async function createServer() {
    const app: Application = express();
    const httpServer = http.createServer(app);

    // 基本中间件
    app.use(cors({
        origin: config.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }));
    app.use(helmet());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 初始化 Socket.IO
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: config.corsOrigins,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // 初始化服务
    const userService = new UserService();
    const messageService = new MessageService();

    // 初始化 Socket 控制器
    const socketController = new SocketController(io, userService, messageService);

    // 注册 Socket 处理程序
    registerSocketHandlers(io, socketController);

    // 基本路由
    app.get('/', (req, res) => {
        res.json({
            message: '即时通信服务器正在运行',
            timestamp: new Date().toISOString()
        });
    });

    // 错误处理中间件
    app.use(errorMiddleware);

    // 处理未捕获的错误
    process.on('uncaughtException', (error) => {
        logger.error('未捕获的异常:', error);
    });

    process.on('unhandledRejection', (reason) => {
        logger.error('未处理的拒绝:', reason);
    });

    return { app, httpServer, io };
} 