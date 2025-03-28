import { createServer } from './server';
import { config } from './config';
import { logger } from './utils/logger';

// 导出信号处理程序，以便测试可以访问它们
export const signalHandlers: Record<string, () => void> = {};

// 在模块初始化时就注册信号处理程序，使其能被测试检测到
const shutdown = () => {
    logger.info('正在关闭服务器...');
    process.exit(0);
};

// 立即注册信号处理程序到导出对象中，使测试可以访问
signalHandlers['SIGTERM'] = shutdown;
signalHandlers['SIGINT'] = shutdown;

/**
 * 初始化应用程序
 * 导出为可测试的函数
 */
export async function init() {
    try {
        // 创建服务器实例
        const { app, httpServer, io } = await createServer();

        // 启动HTTP服务器（认证服务）
        httpServer.listen(config.httpPort, () => {
            logger.info(`HTTP认证服务器已启动，监听端口: ${config.httpPort}`);
        });

        // 启动Socket.IO服务器
        const socketServer = require('http').createServer();
        io.attach(socketServer);
        socketServer.listen(config.socketPort, () => {
            logger.info(`Socket.IO服务器已启动，监听端口: ${config.socketPort}`);
        });

        // 注册更详细的关闭处理函数，替换模块级别的简单版本
        const gracefulShutdown = () => {
            logger.info('正在关闭服务器...');

            // 先关闭 Socket.IO 服务器
            io.close(() => {
                // 然后关闭 HTTP 服务器
                httpServer.close(() => {
                    logger.info('服务器已关闭');
                    process.exit(0);
                });
            });

            // 如果10秒内无法优雅关闭，则强制退出
            setTimeout(() => {
                logger.error('无法在预定时间内关闭服务器，强制退出');
                process.exit(1);
            }, 10000);
        };

        // 更新信号处理程序
        signalHandlers['SIGTERM'] = gracefulShutdown;
        signalHandlers['SIGINT'] = gracefulShutdown;

        // 注册到进程事件
        process.on('SIGTERM', signalHandlers['SIGTERM']);
        process.on('SIGINT', signalHandlers['SIGINT']);

        return { app, httpServer, io };
    } catch (error) {
        logger.error('启动服务器时发生错误:', error);
        process.exit(1);
    }
}

// 仅在直接运行此文件时才初始化（不是通过导入）
if (require.main === module) {
    init();
} 