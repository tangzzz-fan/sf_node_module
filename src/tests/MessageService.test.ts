import { MessageService } from '../services/MessageService';
import { Message } from '../types';

describe('MessageService', () => {
    let messageService: MessageService;

    beforeEach(() => {
        messageService = new MessageService();
    });

    test('应该能够创建消息', () => {
        const timestamp = new Date();
        const messageData = {
            from: 'user1',
            fromUsername: 'User 1',
            to: 'user2',
            content: 'Hello, world!',
            isRoomMessage: false,
            timestamp,
            read: false
        };

        const message = messageService.createMessage(messageData);

        expect(message.id).toBeDefined();
        expect(message.from).toBe('user1');
        expect(message.fromUsername).toBe('User 1');
        expect(message.to).toBe('user2');
        expect(message.content).toBe('Hello, world!');
        expect(message.isRoomMessage).toBe(false);
        expect(message.timestamp).toBe(timestamp);
        expect(message.read).toBe(false);

        const retrievedMessage = messageService.getMessageById(message.id);
        expect(retrievedMessage).toEqual(message);
    });

    test('应该能够更新消息', () => {
        const messageData = {
            from: 'user1',
            fromUsername: 'User 1',
            to: 'user2',
            content: 'Hello, world!',
            isRoomMessage: false,
            timestamp: new Date(),
            read: false
        };

        const message = messageService.createMessage(messageData);
        message.read = true;
        message.content = 'Updated content';

        const updatedMessage = messageService.updateMessage(message);
        expect(updatedMessage.read).toBe(true);
        expect(updatedMessage.content).toBe('Updated content');

        const retrievedMessage = messageService.getMessageById(message.id);
        expect(retrievedMessage).toEqual(updatedMessage);
    });

    test('应该能够获取用户的私人消息历史', () => {
        const timestamp1 = new Date('2023-01-01T10:00:00Z');
        const timestamp2 = new Date('2023-01-01T11:00:00Z');

        // user1 发给 user2 的消息
        const message1 = messageService.createMessage({
            from: 'user1',
            fromUsername: 'User 1',
            to: 'user2',
            content: 'Hello from user1',
            isRoomMessage: false,
            timestamp: timestamp1,
            read: false
        });

        // user2 发给 user1 的消息
        const message2 = messageService.createMessage({
            from: 'user2',
            fromUsername: 'User 2',
            to: 'user1',
            content: 'Reply from user2',
            isRoomMessage: false,
            timestamp: timestamp2,
            read: false
        });

        // user3 发给 user4 的消息，不应该出现在 user1 的历史中
        const message3 = messageService.createMessage({
            from: 'user3',
            fromUsername: 'User 3',
            to: 'user4',
            content: 'Hello from user3',
            isRoomMessage: false,
            timestamp: new Date(),
            read: false
        });

        const user1History = messageService.getUserMessageHistory('user1');
        expect(user1History).toHaveLength(2);
        expect(user1History[0]).toEqual(message1); // timestamp1 较早，应该在前面
        expect(user1History[1]).toEqual(message2);

        const user2History = messageService.getUserMessageHistory('user2');
        expect(user2History).toHaveLength(2);

        const user3History = messageService.getUserMessageHistory('user3');
        expect(user3History).toHaveLength(1);
        expect(user3History[0]).toEqual(message3);
    });

    test('应该能够获取房间消息历史', () => {
        const room1 = 'room1';
        const room2 = 'room2';

        // room1 的消息
        const roomMessage1 = messageService.createMessage({
            from: 'user1',
            fromUsername: 'User 1',
            to: room1,
            content: 'Hello room1',
            isRoomMessage: true,
            timestamp: new Date('2023-01-01T10:00:00Z'),
            read: false
        });

        const roomMessage2 = messageService.createMessage({
            from: 'user2',
            fromUsername: 'User 2',
            to: room1,
            content: 'User2 in room1',
            isRoomMessage: true,
            timestamp: new Date('2023-01-01T11:00:00Z'),
            read: false
        });

        // room2 的消息
        const roomMessage3 = messageService.createMessage({
            from: 'user1',
            fromUsername: 'User 1',
            to: room2,
            content: 'Hello room2',
            isRoomMessage: true,
            timestamp: new Date(),
            read: false
        });

        const room1History = messageService.getRoomMessageHistory(room1);
        expect(room1History).toHaveLength(2);
        expect(room1History[0]).toEqual(roomMessage1);
        expect(room1History[1]).toEqual(roomMessage2);

        const room2History = messageService.getRoomMessageHistory(room2);
        expect(room2History).toHaveLength(1);
        expect(room2History[0]).toEqual(roomMessage3);
    });

    test('应该能够获取用户的未读消息', () => {
        // 用户2的未读消息
        messageService.createMessage({
            from: 'user1',
            fromUsername: 'User 1',
            to: 'user2',
            content: 'Unread message 1',
            isRoomMessage: false,
            timestamp: new Date(),
            read: false
        });

        messageService.createMessage({
            from: 'user3',
            fromUsername: 'User 3',
            to: 'user2',
            content: 'Unread message 2',
            isRoomMessage: false,
            timestamp: new Date(),
            read: false
        });

        // 已读消息
        const readMessage = messageService.createMessage({
            from: 'user1',
            fromUsername: 'User 1',
            to: 'user2',
            content: 'Read message',
            isRoomMessage: false,
            timestamp: new Date(),
            read: true
        });

        // 给其他用户的消息
        messageService.createMessage({
            from: 'user1',
            fromUsername: 'User 1',
            to: 'user3',
            content: 'Message for user3',
            isRoomMessage: false,
            timestamp: new Date(),
            read: false
        });

        const unreadMessages = messageService.getUnreadMessages('user2');
        expect(unreadMessages).toHaveLength(2);
        expect(unreadMessages.map(m => m.content)).toContain('Unread message 1');
        expect(unreadMessages.map(m => m.content)).toContain('Unread message 2');
        expect(unreadMessages.map(m => m.content)).not.toContain('Read message');
        expect(unreadMessages.map(m => m.content)).not.toContain('Message for user3');
    });

    test('应该能够删除消息', () => {
        const message = messageService.createMessage({
            from: 'user1',
            fromUsername: 'User 1',
            to: 'user2',
            content: 'Test message',
            isRoomMessage: false,
            timestamp: new Date(),
            read: false
        });

        expect(messageService.getMessageById(message.id)).toBeDefined();
        expect(messageService.deleteMessage(message.id)).toBe(true);
        expect(messageService.getMessageById(message.id)).toBeUndefined();
        expect(messageService.deleteMessage('non-existent-id')).toBe(false);
    });
}); 