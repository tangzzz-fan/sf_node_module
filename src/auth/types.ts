import { Socket } from 'socket.io';

export interface RegisterUserDto {
    email: string;
    password: string;
    username: string;
}

export interface LoginUserDto {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        userId: string;
        email: string;
        username: string;
    };
}

export interface AuthenticatedUser {
    userId: string;
    email: string;
    username: string;
}

export interface AuthenticatedSocketData {
    user: AuthenticatedUser;
}

export interface AuthenticatedSocket extends Socket {
    data: AuthenticatedSocketData;
}