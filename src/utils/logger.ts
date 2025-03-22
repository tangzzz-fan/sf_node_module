/**
 * 简单的日志记录工具
 */
export const logger = {
    /**
     * 记录信息日志
     * @param message 日志消息
     * @param args 额外参数
     */
    info(message: any, ...args: any[]): void {
        console.log(`[INFO] ${new Date().toISOString()}:`, message, ...args);
    },

    /**
     * 记录警告日志
     * @param message 日志消息
     * @param args 额外参数
     */
    warn(message: any, ...args: any[]): void {
        console.warn(`[WARN] ${new Date().toISOString()}:`, message, ...args);
    },

    /**
     * 记录错误日志
     * @param message 日志消息
     * @param args 额外参数
     */
    error(message: any, ...args: any[]): void {
        console.error(`[ERROR] ${new Date().toISOString()}:`, message, ...args);
    },

    /**
     * 记录调试日志
     * @param message 日志消息
     * @param args 额外参数
     */
    debug(message: any, ...args: any[]): void {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${new Date().toISOString()}:`, message, ...args);
        }
    }
}; 