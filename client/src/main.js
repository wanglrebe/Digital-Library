import './style.css';
import './auth/auth.css';
import Phaser from 'phaser';
import config from './game/config';
import { checkActivationStatus } from './auth/mockAuth.js';
import LoginUI from './auth/LoginUI.js';
import ActivationFlow from './auth/ActivationFlow.js'; // 🆕

console.log('🚀 Digital Library 启动中...');

// ========================================
// 立即隐藏 HUD（同步执行）
// ========================================
(function immediateHideHUD() {
  const hudIds = ['hud-floor', 'hud-top-right', 'hud-bottom', 'hud-bottom-right'];
  
  hudIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.setProperty('display', 'none', 'important');
      console.log(`🔒 [立即隐藏] ${id}`);
    }
  });
  
  console.log('✅ HUD 已立即隐藏');
})();

// ========================================
// 初始化认证流程
// ========================================
const user = checkActivationStatus();

if (!user) {
  console.log('👤 未登录，显示登录界面');
  showLoginUI();
} else if (!user.isActivated) {
  console.log('🔄 用户未激活，显示激活流程');
  showActivationFlow();  // 🆕 显示激活流程
} else {
  console.log('✅ 用户已激活，直接启动游戏');
  startGame(user.username);
}

// ========================================
// 函数定义
// ========================================

/**
 * 显示所有 HUD 元素
 */
function showAllHUD() {
  console.log('🔓 开始显示 HUD...');
  
  const hudIds = ['hud-floor', 'hud-top-right', 'hud-bottom', 'hud-bottom-right'];
  
  hudIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.removeProperty('display');
      console.log(`✅ [显示] ${id}`);
    } else {
      console.warn(`⚠️ 未找到元素: ${id}`);
    }
  });
  
  console.log('✅ HUD 已全部显示');
}

/**
 * 显示登录界面
 */
function showLoginUI() {
  const loginUI = new LoginUI((user) => {
    console.log('🎉 登录成功回调:', user);
    
    loginUI.hide(() => {
      if (user.isActivated) {
        startGame(user.username);
      } else {
        console.log('🔄 需要激活，显示激活流程');
        showActivationFlow();  // 🆕 显示激活流程
      }
    });
  });
}

/**
 * 🆕 显示激活流程
 */
function showActivationFlow() {
  const activationFlow = new ActivationFlow((user) => {
    console.log('🎉 激活完成回调:', user);
    startGame(user.username);
  });
}

/**
 * 启动游戏
 */
function startGame(username) {
  console.log(`🎮 启动游戏，用户名: ${username}`);
  
  window.currentUsername = username;
  
  // 🔧 显示 HUD
  showAllHUD();
  
  // 启动 Phaser 游戏
  const game = new Phaser.Game(config);
  window.game = game;
  
  console.log('✅ 游戏已启动！');
}