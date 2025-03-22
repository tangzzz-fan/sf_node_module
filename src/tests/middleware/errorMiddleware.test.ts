import { errorMiddleware } from '../../middleware/errorMiddleware';
import { logger } from '../../utils/logger';

// 模拟logger
jest.mock('../../utils/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

describe('Error Middleware', () => {
    let mockRequest: any;
    let mockResponse: any;
    let mockNext: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {
            method: 'GET',
            path: '/test'
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        mockNext = jest.fn();

        // 保存并修改环境变量
        process.env.NODE_ENV_ORIGINAL = process.env.NODE_ENV;
    });

    afterEach(() => {
        // 恢复环境变量
        process.env.NODE_ENV = process.env.NODE_ENV_ORIGINAL;
        delete process.env.NODE_ENV_ORIGINAL;
    });

    test('应该处理带有状态码的错误', () => {
        const error = new Error('测试错误');
        (error as any).statusCode = 400;

        errorMiddleware(error, mockRequest, mockResponse, mockNext);

        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('状态码: 400'));
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: '测试错误'
        }));
    });

    test('应该为未指定状态码的错误使用500', () => {
        const error = new Error('内部服务器错误');

        errorMiddleware(error, mockRequest, mockResponse, mockNext);

        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('状态码: 500'));
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: '内部服务器错误'
        }));
    });

    test('开发环境应该包含堆栈信息', () => {
        process.env.NODE_ENV = 'development';
        const error = new Error('测试错误');
        error.stack = 'mock stack trace';

        errorMiddleware(error, mockRequest, mockResponse, mockNext);

        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            stack: 'mock stack trace'
        }));
    });

    test('生产环境不应包含堆栈信息', () => {
        process.env.NODE_ENV = 'production';
        const error = new Error('测试错误');
        error.stack = 'mock stack trace';

        errorMiddleware(error, mockRequest, mockResponse, mockNext);

        expect(mockResponse.json).not.toHaveBeenCalledWith(expect.objectContaining({
            stack: expect.anything()
        }));
    });
}); 