import { createServer } from '../server';
import { io as Client } from 'socket.io-client';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { SocketEvents } from '../types';
import http from 'http';

describe('Socket.io 服务器端到端测试', () => {
    let httpServer: http.Server;
    let ioServer: Server;
    let clientSocket: any;
    let clientSocket2: any;
    let port: number;

    // 在所有测试之前设置服务器
    beforeAll(async () => {
        const server = await createServer();
        httpServer = server.httpServer;
        ioServer = server.io;

        // 启动服务器并获取分配的端口
        httpServer.listen();
        const address = httpServer.address() as AddressInfo;
        port = address.port;
    });

    // 在每次测试后清理连接
    afterEach(() => {
        if (clientSocket) {
            clientSocket.disconnect();
            clientSocket = null;
        }
        if (clientSocket2) {
            clientSocket2.disconnect();
            clientSocket2 = null;
        }
    });

    // 在所有测试后关闭服务器
    afterAll(() => {
        ioServer.close();
        httpServer.close();
    });

    test('应该能够连接到服务器并接收用户列表', (done) => {
        clientSocket = Client(`http://localhost:${port}`, {
            auth: {
                username: 'testuser1'
            },
            transports: ['websocket']
        });

        clientSocket.on('connect', () => {
            expect(clientSocket.connected).toBe(true);
        });

        clientSocket.on(SocketEvents.USERS_LIST, (usersList: any) => {
            expect(Array.isArray(usersList)).toBe(true);
            expect(usersList.length).toBeGreaterThan(0);
            expect(usersList[0].username).toBe('testuser1');
            done();
        });
    }, 10000);

    test('第二个用户应该收到第一个用户的加入通知', (done) => {
        // 创建一个Promise表示第一个用户已连接
        const user1Connected = new Promise<void>((resolve) => {
            clientSocket = Client(`http://localhost:${port}`, {
                auth: {
                    username: 'testuser1'
                },
                transports: ['websocket']
            });

            clientSocket.on('connect', () => {
                // 确保第一个用户完全连接
                setTimeout(resolve, 500);
            });
        });

        // 第一个用户连接后，连接第二个用户
        user1Connected.then(() => {
            clientSocket2 = Client(`http://localhost:${port}`, {
                auth: {
                    username: 'testuser2'
                },
                transports: ['websocket']
            });

            // 第二个用户应该能看到用户列表中包含第一个用户
            clientSocket2.on(SocketEvents.USERS_LIST, (users: any[]) => {
                const user1 = users.find(u => u.username === 'testuser1');
                if (user1) {
                    expect(user1).toBeDefined();
                    done();
                }
            });
        });
    }, 15000);

    test('应该能够发送和接收私人消息', (done) => {
        // 连接两个用户
        clientSocket = Client(`http://localhost:${port}`, {
            auth: {
                username: 'testuser1'
            },
            transports: ['websocket']
        });

        let user2Id = '';

        clientSocket.once(SocketEvents.USERS_LIST, (users: any[]) => {
            // 保存第一个用户 ID 备用
            const user1 = users.find(u => u.username === 'testuser1');

            // 连接第二个用户
            clientSocket2 = Client(`http://localhost:${port}`, {
                auth: {
                    username: 'testuser2'
                },
                transports: ['websocket']
            });

            clientSocket2.once(SocketEvents.USERS_LIST, (users: any[]) => {
                // 找到第二个用户 ID
                const user2 = users.find(u => u.username === 'testuser2');
                if (user2) {
                    user2Id = user2.id;

                    // 第一个用户向第二个用户发送消息
                    clientSocket.emit(SocketEvents.MESSAGE_PRIVATE, {
                        to: user2Id,
                        content: 'Hello from user1'
                    });
                }
            });

            // 第二个用户应该收到消息 - 使用once而不是on
            clientSocket2.once(SocketEvents.MESSAGE_PRIVATE, (message: any) => {
                expect(message.fromUsername).toBe('testuser1');
                expect(message.content).toBe('Hello from user1');
                done();
            });
        });
    }, 10000);

    test('应该能够创建和加入房间', (done) => {
        clientSocket = Client(`http://localhost:${port}`, {
            auth: {
                username: 'testuser1'
            },
            transports: ['websocket']
        });

        let roomId = '';
        let secondUserJoined = false;

        // 创建房间
        clientSocket.on('connect', () => {
            clientSocket.emit(SocketEvents.ROOM_CREATED, {
                name: 'Test Room',
                description: 'A room for testing'
            });
        });

        // 接收房间创建确认
        clientSocket.once(SocketEvents.ROOM_CREATED, (room: any) => {
            roomId = room.id;
            expect(room.name).toBe('Test Room');

            // 连接第二个用户
            clientSocket2 = Client(`http://localhost:${port}`, {
                auth: {
                    username: 'testuser2'
                },
                transports: ['websocket']
            });

            // 确保只在第一次收到房间列表时触发
            let roomListReceived = false;

            // 第二个用户应该收到房间列表，包括新创建的房间
            clientSocket2.on(SocketEvents.ROOM_LIST, (rooms: any[]) => {
                if (roomListReceived) return; // 防止多次处理
                roomListReceived = true;

                const testRoom = rooms.find(r => r.name === 'Test Room');
                expect(testRoom).toBeDefined();

                // 第二个用户加入房间
                if (testRoom) {
                    clientSocket2.emit(SocketEvents.ROOM_JOINED, { roomId: testRoom.id });
                }
            });

            // 第一个用户应该收到第二个用户加入房间的通知，使用once确保只调用一次
            clientSocket.once(SocketEvents.USER_JOINED_ROOM, (data: any) => {
                if (secondUserJoined) return; // 防止多次调用
                secondUserJoined = true;

                expect(data.roomId).toBe(roomId);
                expect(data.username).toBe('testuser2');
                done();
            });
        });
    }, 10000);
}); 