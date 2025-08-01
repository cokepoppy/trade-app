import { Router } from 'express';
console.log('Router 导入成功');
import { UserController } from '../../controllers/api/UserController';
console.log('UserController 导入成功');
import { authMiddleware } from '../../middleware/auth';
console.log('authMiddleware 导入成功');
/**
 * 用户路由
 */
const router = Router();
const userController = new UserController();

/**
 * 用户认证路由
 */
// 用户登录
router.post('/login', userController.login);

// 用户注册
router.post('/register', userController.register);

// 用户登出
router.post('/logout', authMiddleware, userController.logout);

// 刷新Token
router.post('/refresh-token', userController.refreshToken);

/**
 * 用户信息路由
 */
// 获取当前用户信息
router.get('/current', authMiddleware, userController.getCurrentUser);

// 更新用户资料
router.put('/profile', authMiddleware, userController.updateProfile);

// 修改密码
router.put('/change-password', authMiddleware, userController.changePassword);

// 重置密码
router.post('/reset-password', userController.resetPassword);

/**
 * 用户详细资料路由
 */
// 获取用户详细资料
router.get('/profile', authMiddleware, userController.getUserProfile);

/**
 * 用户设置路由
 */
// 获取用户设置
router.get('/settings', authMiddleware, userController.getUserSettings);

// 更新用户设置
router.put('/settings', authMiddleware, userController.updateUserSettings);

/**
 * 用户设备路由
 */
// 获取用户设备列表
router.get('/devices', authMiddleware, userController.getUserDevices);

/**
 * 用户历史记录路由
 */
// 获取用户登录历史
router.get('/login-history', authMiddleware, userController.getLoginHistory);

// 获取用户活动记录
router.get('/activities', authMiddleware, userController.getUserActivities);

export default router;