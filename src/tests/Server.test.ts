import request from 'supertest';
import { createServer } from '../server';
import http from 'http';
import express from 'express';

describe('服务器 API 路由测试', () => {
    let app: express.Application;
    let httpServer: http.Server;

    beforeAll(async () => {
        const server = await createServer();
        app = server.app;
        httpServer = server.httpServer;
    });

    afterAll(() => {
        httpServer.close();
    });

    test('主页路由应返回成功状态', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
    });

    test('对于不存在的路由应返回 404', async () => {
        const response = await request(app).get('/not-found');
        expect(response.status).toBe(404);
    });
}); 