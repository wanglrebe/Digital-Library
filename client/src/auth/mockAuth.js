/**
 * mockAuth.js - Mock 认证系统
 * 使用 LocalStorage 模拟用户认证，后期可无缝替换为真实 API
 */

const STORAGE_KEY = 'dlib-user';

/**
 * 生成唯一用户ID
 */
function generateUserId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DL-${timestamp}${random}`;
}

/**
 * Mock 登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} 用户数据
 */
export async function mockLogin(username, password) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock: 任何用户名密码都通过
  if (!username || !password) {
    throw new Error('用户名和密码不能为空');
  }
  
  // 检查是否已有该用户
  let user = getUserData();
  
  if (!user || user.username !== username) {
    // 新用户，创建账户
    user = {
      username: username,
      isActivated: false,
      userId: generateUserId(),
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    };
  } else {
    // 老用户，更新登录时间
    user.lastLoginAt = Date.now();
  }
  
  // 保存到 LocalStorage
  saveUserData(user);
  
  console.log('✅ Mock 登录成功:', user);
  return user;
}

/**
 * 检查用户激活状态
 * @returns {object|null} 用户数据或 null
 */
export function checkActivationStatus() {
  const user = getUserData();
  console.log('🔍 检查激活状态:', user);
  return user;
}

/**
 * 保存激活数据
 * @param {object} activationData - 激活数据
 */
export function saveActivationData(activationData) {
  const user = getUserData();
  
  if (!user) {
    throw new Error('未找到用户数据');
  }
  
  // 合并激活数据
  const updatedUser = {
    ...user,
    isActivated: true,
    characterName: activationData.characterName,
    email: activationData.email,
    avatarBase64: activationData.avatarBase64,
    joinDate: new Date().toISOString().split('T')[0],
    activatedAt: Date.now()
  };
  
  saveUserData(updatedUser);
  console.log('✅ 激活数据已保存:', updatedUser);
  
  return updatedUser;
}

/**
 * 获取用户数据
 */
function getUserData() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * 保存用户数据
 */
function saveUserData(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/**
 * 登出（清除数据）
 */
export function mockLogout() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('👋 已登出');
}

/**
 * 🔧 开发工具：清除所有数据
 */
export function clearMockData() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ 已清除所有 Mock 数据');
}

// 暴露到全局（方便调试）
if (typeof window !== 'undefined') {
  window.clearMockData = clearMockData;
  console.log('🛠️ 开发工具已加载: 在控制台输入 clearMockData() 可清除数据');
}