// 确保Jest不缓存这些模拟
jest.mock('../server');
jest.mock('../utils/logger');
jest.mock('../config');

// 清除缓存
jest.resetModules();

// 直接创建测试模拟，添加类型注解
interface MockServer {
    httpServer: {
        listen: jest.Mock;
        close: jest.Mock;
    };
    io: any;
}

const mockServer: MockServer = {
    httpServer: {
        listen: jest.fn((port, callback) => {
            if (callback) callback();
            return mockServer.httpServer;
        }),
        close: jest.fn((callback) => {
            if (callback) callback();
            return mockServer.httpServer;
        })
    },
    io: {}
};

// 设置模拟实现
const mockCreateServer = jest.fn().mockResolvedValue(mockServer);
jest.mock('../server', () => ({
    createServer: mockCreateServer
}));

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
};
jest.mock('../utils/logger', () => ({
    logger: mockLogger
}));

// 导入配置供index.ts使用
jest.mock('../config', () => ({
    config: {
        port: 3000
    }
}));

// 存储信号处理程序
const signalHandlers: Record<string, Function> = {};

describe('Server Entry Point', () => {
    let exitSpy: jest.SpyInstance;
    let processOnSpy: jest.SpyInstance;

    beforeAll(() => {
        // 在所有测试前重置模块缓存
        jest.resetModules();
    });

    beforeEach(() => {
        // 清除所有Mock调用记录和信号处理程序
        jest.clearAllMocks();
        Object.keys(signalHandlers).forEach(key => delete signalHandlers[key]);

        // 拦截process.exit
        exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

        // 拦截process.on，保存处理程序函数
        processOnSpy = jest.spyOn(process, 'on').mockImplementation((signal, handler) => {
            signalHandlers[signal as string] = handler as Function;
            return process;
        });
    });

    afterEach(() => {
        exitSpy.mockRestore();
        processOnSpy.mockRestore();
    });

    test('应该启动服务器并监听端口', async () => {
        // 导入index模块
        await import('../index');

        // 验证服务器创建
        expect(mockCreateServer).toHaveBeenCalled();

        // 验证服务器监听
        expect(mockServer.httpServer.listen).toHaveBeenCalled();

        // 验证日志记录
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('服务器已启动'));
    });

    test('应该注册信号处理程序', async () => {
        await import('../index');

        // 直接检查是否存在处理程序，而不是检查调用
        expect(signalHandlers['SIGTERM']).toBeDefined();
        expect(signalHandlers['SIGINT']).toBeDefined();
        expect(typeof signalHandlers['SIGTERM']).toBe('function');
        expect(typeof signalHandlers['SIGINT']).toBe('function');
    });

    test('应该优雅地处理关闭', async () => {
        await import('../index');

        // 直接获取并调用处理程序
        const sigTermHandler = signalHandlers['SIGTERM'];
        expect(sigTermHandler).toBeDefined();

        // 执行处理程序
        sigTermHandler();

        // 验证关闭流程
        expect(mockLogger.info).toHaveBeenCalledWith('正在关闭服务器...');
        expect(mockServer.httpServer.close).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('HTTP 服务器已关闭');
        expect(exitSpy).toHaveBeenCalledWith(0);
    });

    test('应该处理启动错误', async () => {
        // 修改createServer以返回错误
        const error = new Error('启动错误');
        mockCreateServer.mockRejectedValueOnce(error);

        // 重新加载模块
        jest.resetModules();

        try {
            await import('../index');
        } catch (e) {
            // 忽略错误
        }

        // 验证错误处理
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining('启动服务器时发生错误'),
            expect.any(Error)
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
}); 