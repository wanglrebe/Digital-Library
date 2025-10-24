/**
 * LoginUI.js - 登录界面
 * 温馨的像素风登录卡片，包含背景动画和优雅的交互
 */

import { mockLogin } from './mockAuth.js';

export default class LoginUI {
  constructor(onLoginSuccess) {
    this.onLoginSuccess = onLoginSuccess; // 登录成功回调
    this.container = null;
    this.isLoading = false;
    
    this.create();
  }
  
  /**
   * 创建登录界面
   */
  create() {
    // 创建遮罩层容器
    this.container = document.createElement('div');
    this.container.id = 'auth-overlay';
    
    // 添加背景装饰（漂浮的书本）
    for (let i = 0; i < 4; i++) {
      const decoration = document.createElement('div');
      decoration.className = 'auth-decoration';
      decoration.textContent = '📚';
      this.container.appendChild(decoration);
    }
    
    // 创建登录卡片
    const card = document.createElement('div');
    card.className = 'auth-card';
    card.innerHTML = `
      <!-- Logo 区域 -->
      <div class="auth-logo">
        <span class="auth-logo-icon">📚</span>
        <h1 class="auth-logo-title">Digital Library</h1>
        <p class="auth-logo-subtitle">像素风虚拟自习室</p>
      </div>
      
      <!-- 登录表单 -->
      <form id="login-form" class="auth-form">
        <div class="auth-input-group">
          <label for="username" class="auth-label">用户名</label>
          <input
            type="text"
            id="username"
            class="auth-input"
            placeholder="请输入用户名"
            autocomplete="username"
            required
          />
        </div>
        
        <div class="auth-input-group">
          <label for="password" class="auth-label">密码</label>
          <input
            type="password"
            id="password"
            class="auth-input"
            placeholder="请输入密码"
            autocomplete="current-password"
            required
          />
        </div>
        
        <button type="submit" class="auth-button" id="login-button">
          进入图书馆
        </button>
        
        <!-- 错误提示（默认隐藏） -->
        <div id="login-error" class="auth-error" style="display: none;"></div>
      </form>
      
      <!-- 底部提示 -->
      <div class="auth-footer">
        <p>📖 一个专注学习、温暖陪伴的小天地</p>
        <p class="auth-footer-hint">纯内部邀请制 · 首次登录需激活账号</p>
      </div>
    `;
    
    this.container.appendChild(card);
    
    // 添加开发工具提示
    if (this.isDevMode()) {
      const devHint = document.createElement('div');
      devHint.className = 'dev-hint';
      devHint.innerHTML = `
        🛠️ DEV MODE<br>
        Shift + 点击登录 = 跳过激活
      `;
      this.container.appendChild(devHint);
    }
    
    // 🔧 修复：先添加到 DOM，再绑定事件
    document.body.appendChild(this.container);
    
    // 绑定事件（此时 DOM 元素已存在）
    this.bindEvents();
    
    // 自动聚焦到用户名输入框
    setTimeout(() => {
      const usernameInput = document.getElementById('username');
      if (usernameInput) {
        usernameInput.focus();
      }
    }, 600);
    
    console.log('🔐 登录界面已创建');
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    const form = document.getElementById('login-form');
    const button = document.getElementById('login-button');
    
    // 表单提交
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
    
    // 🔧 开发工具：Shift + 点击 = 跳过激活
    button.addEventListener('click', (e) => {
      if (e.shiftKey && this.isDevMode()) {
        e.preventDefault();
        console.log('🔧 DEV: 跳过激活流程');
        this.skipActivation();
      }
    });
    
    // 回车提交
    ['username', 'password'].forEach(id => {
      document.getElementById(id).addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          form.dispatchEvent(new Event('submit'));
        }
      });
    });
  }
  
  /**
   * 处理登录
   */
  async handleLogin() {
    if (this.isLoading) return;
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const button = document.getElementById('login-button');
    const errorEl = document.getElementById('login-error');
    
    // 验证输入
    if (!username || !password) {
      this.showError('请输入用户名和密码');
      return;
    }
    
    // 显示加载状态
    this.isLoading = true;
    button.classList.add('loading');
    button.disabled = true;
    button.textContent = '登录中';
    errorEl.style.display = 'none';
    
    try {
      // 调用 Mock 登录
      const user = await mockLogin(username, password);
      
      console.log('✅ 登录成功，用户数据:', user);
      
      // 短暂延迟，让用户看到成功状态
      button.textContent = '✓ 登录成功';
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 调用成功回调
      if (this.onLoginSuccess) {
        this.onLoginSuccess(user);
      }
      
    } catch (error) {
      console.error('❌ 登录失败:', error);
      this.showError(error.message || '登录失败，请重试');
      
      // 恢复按钮状态
      this.isLoading = false;
      button.classList.remove('loading');
      button.disabled = false;
      button.textContent = '进入图书馆';
    }
  }
  
  /**
   * 显示错误提示
   */
  showError(message) {
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = `⚠️ ${message}`;
    errorEl.style.display = 'block';
    
    // 聚焦到用户名输入框
    document.getElementById('username').focus();
  }
  
  /**
   * 🔧 开发工具：跳过激活
   */
  async skipActivation() {
    const username = document.getElementById('username').value.trim() || 'DevUser';
    
    // 创建一个已激活的用户
    const mockUser = {
      username: username,
      isActivated: true,
      characterName: username,
      email: 'dev@example.com',
      avatarBase64: null,
      userId: 'DL-DEV123',
      joinDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };
    
    localStorage.setItem('dlib-user', JSON.stringify(mockUser));
    
    console.log('🔧 DEV: 已创建激活用户:', mockUser);
    
    // 淡出登录界面
    this.hide(() => {
      if (this.onLoginSuccess) {
        this.onLoginSuccess(mockUser);
      }
    });
  }
  
  /**
   * 隐藏登录界面
   */
  hide(callback) {
    this.container.style.animation = 'authFadeOut 0.4s ease-in';
    
    setTimeout(() => {
      this.container.remove();
      if (callback) callback();
    }, 400);
  }
  
  /**
   * 检查是否为开发模式
   */
  isDevMode() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
  
  /**
   * 销毁
   */
  destroy() {
    if (this.container) {
      this.container.remove();
    }
  }
}

// 添加淡出动画到 CSS（动态注入）
if (!document.getElementById('auth-fadeout-style')) {
  const style = document.createElement('style');
  style.id = 'auth-fadeout-style';
  style.textContent = `
    @keyframes authFadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }
  `;
  document.head.appendChild(style);
}