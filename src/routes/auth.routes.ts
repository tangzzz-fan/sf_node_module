import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../auth/auth.middleware';
import { AuthService } from '../auth/auth.service';

export function registerAuthRoutes(router: Router, authService: AuthService): void {
    const authController = new AuthController(authService);

    // 注册路由
    router.post('/auth/register', (req, res) => authController.register(req, res));
    router.post('/auth/login', (req, res) => authController.login(req, res));

    // 需要认证的路由
    router.get('/auth/me', authenticate(authService), (req, res) => authController.getCurrentUser(req, res));
}