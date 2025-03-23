import { Socket } from 'socket.io';

export interface User {
    userId: string;
    username: string;
    socketId: string;
    connected: boolean;
    lastActive: Date;
}

export interface Message {
    id: string;
    from: string;
    fromUsername: string;
    to: string;
    content: string;
    timestamp: Date;
    isRoomMessage: boolean;
    read: boolean;
}

export interface Room {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    isPrivate: boolean;
    members: string[]; // userId列表
}

export interface AuthenticatedSocket extends Socket {
    userId?: string;
    username?: string;
}

export interface PrivateMessagePayload {
    recipientId: string;
    content: string;
    timestamp?: number;
}

export interface RoomMessagePayload {
    roomId: string;
    content: string;
}

export interface JoinRoomPayload {
    roomId: string;
}

export interface CreateRoomPayload {
    name: string;
    description?: string;
    isPrivate?: boolean;
    initialMembers?: string[];
}

export enum SocketEvents {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    ERROR = 'error',
    USER_JOINED = 'user:joined',
    USER_LEFT = 'user:left',
    USERS_LIST = 'users:list',
    USER_JOINED_ROOM = 'user:joined:room',
    USER_LEFT_ROOM = 'user:left:room',
    MESSAGE_PRIVATE = 'message:private',
    MESSAGE_ROOM = 'message:room',
    MESSAGE_SENT = 'message:sent',
    MESSAGE_READ = 'message:read',
    MESSAGE_RECEIVED = 'message:received',
    ROOM_CREATED = 'room:created',
    ROOM_JOINED = 'room:join',
    ROOM_LEFT = 'room:leave',
    ROOM_LIST = 'room:list',
    STSTEM_MESSAGE = 'system:message'
} 