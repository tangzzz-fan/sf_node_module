import { UserService } from '../services/UserService';
import { User } from '../types';

describe('UserService', () => {
    let userService: UserService;

    beforeEach(() => {
        userService = new UserService();
    });

    test('应该能够添加用户', () => {
        const user: User = {
            id: '1',
            username: 'testuser',
            socketId: 'socket1',
            connected: true,
            lastActive: new Date()
        };

        const addedUser = userService.addUser(user);
        expect(addedUser).toEqual(user);
        expect(userService.getUserById('1')).toEqual(user);
    });

    test('应该能够通过ID查找用户', () => {
        const user: User = {
            id: '1',
            username: 'testuser',
            socketId: 'socket1',
            connected: true,
            lastActive: new Date()
        };

        userService.addUser(user);
        expect(userService.getUserById('1')).toEqual(user);
        expect(userService.getUserById('2')).toBeUndefined();
    });

    test('应该能够通过Socket ID查找用户', () => {
        const user: User = {
            id: '1',
            username: 'testuser',
            socketId: 'socket1',
            connected: true,
            lastActive: new Date()
        };

        userService.addUser(user);
        expect(userService.getUserBySocketId('socket1')).toEqual(user);
        expect(userService.getUserBySocketId('socket2')).toBeUndefined();
    });

    test('应该能够移除用户', () => {
        const user: User = {
            id: '1',
            username: 'testuser',
            socketId: 'socket1',
            connected: true,
            lastActive: new Date()
        };

        userService.addUser(user);
        expect(userService.removeUser('1')).toBe(true);
        expect(userService.getUserById('1')).toBeUndefined();
        expect(userService.removeUser('2')).toBe(false);
    });

    test('应该能够获取所有用户', () => {
        const user1: User = {
            id: '1',
            username: 'testuser1',
            socketId: 'socket1',
            connected: true,
            lastActive: new Date()
        };

        const user2: User = {
            id: '2',
            username: 'testuser2',
            socketId: 'socket2',
            connected: true,
            lastActive: new Date()
        };

        userService.addUser(user1);
        userService.addUser(user2);

        const allUsers = userService.getAllUsers();
        expect(allUsers).toHaveLength(2);
        expect(allUsers).toContainEqual(user1);
        expect(allUsers).toContainEqual(user2);
    });

    test('应该能够更新用户', () => {
        const user: User = {
            id: '1',
            username: 'testuser',
            socketId: 'socket1',
            connected: true,
            lastActive: new Date()
        };

        userService.addUser(user);

        const updates = {
            username: 'updateduser',
            connected: false
        };

        const updatedUser = userService.updateUser('1', updates);
        expect(updatedUser?.username).toBe('updateduser');
        expect(updatedUser?.connected).toBe(false);
        expect(updatedUser?.socketId).toBe('socket1');

        expect(userService.updateUser('2', updates)).toBeUndefined();
    });
}); 