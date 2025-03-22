import { v4 as uuidv4 } from 'uuid';
import { Message } from '../types';

/**
 * 消息服务类 - 管理消息存储和检索
 */
export class MessageService {
    private messages: Map<string, Message> = new Map();

    /**
     * 创建新消息
     * @param messageData 消息数据
     * @returns 创建的消息对象
     */
    public createMessage(messageData: Omit<Message, 'id'>): Message {
        const id = uuidv4();
        const message: Message = {
            id,
            ...messageData
        };

        this.messages.set(id, message);
        return message;
    }

    /**
     * 通过ID获取消息
     * @param messageId 消息ID
     * @returns 消息对象或undefined
     */
    public getMessageById(messageId: string): Message | undefined {
        return this.messages.get(messageId);
    }

    /**
     * 更新消息
     * @param message 更新后的消息对象
     * @returns 更新后的消息对象
     */
    public updateMessage(message: Message): Message {
        if (this.messages.has(message.id)) {
            this.messages.set(message.id, message);
            return message;
        }
        throw new Error(`消息 ID ${message.id} 不存在`);
    }

    /**
     * 删除消息
     * @param messageId 消息ID
     * @returns 是否成功删除
     */
    public deleteMessage(messageId: string): boolean {
        return this.messages.delete(messageId);
    }

    /**
     * 获取用户的所有消息
     * @param userId 用户ID
     * @returns 消息数组
     */
    public getUserMessages(userId: string): Message[] {
        return Array.from(this.messages.values()).filter(
            message => message.from === userId || message.to === userId
        );
    }

    /**
     * 获取用户的消息历史
     * @param userId 用户ID
     * @returns 消息数组
     */
    public getUserMessageHistory(userId: string): Message[] {
        return this.getUserMessages(userId);
    }

    /**
     * 获取用户的未读消息
     * @param userId 用户ID
     * @returns 未读消息数组
     */
    public getUnreadMessages(userId: string): Message[] {
        return Array.from(this.messages.values()).filter(
            message => message.to === userId && !message.read
        );
    }

    /**
     * 获取房间的所有消息
     * @param roomId 房间ID
     * @returns 消息数组
     */
    public getRoomMessages(roomId: string): Message[] {
        return Array.from(this.messages.values()).filter(
            message => message.isRoomMessage && message.to === roomId
        );
    }

    /**
     * 获取房间的消息历史
     * @param roomId 房间ID
     * @returns 消息数组
     */
    public getRoomMessageHistory(roomId: string): Message[] {
        return this.getRoomMessages(roomId);
    }
} 