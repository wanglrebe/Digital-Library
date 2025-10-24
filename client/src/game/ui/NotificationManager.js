/**
 * 像素风通知系统（精简版）
 * 只负责浮动通知，不再管理历史记录（历史由 MessageCenter 管理）
 */
export default class NotificationManager {
  constructor() {
    this.container = document.getElementById('notification-container');
    this.notifications = [];
    this.maxNotifications = 5;
  }
  
  /**
   * 显示通知
   */
  show(message, type = 'info', duration = 3000) {
    // 检查容器是否存在
    if (!this.container) {
      console.warn('⚠️ 通知容器不存在');
      return null;
    }
    
    // 限制同时显示的通知数量
    if (this.notifications.length >= this.maxNotifications) {
      this.remove(this.notifications[0]);
    }
    
    // 图标映射
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${icons[type]}</span>
      <span>${message}</span>
    `;
    
    // 添加到容器
    this.container.appendChild(notification);
    this.notifications.push(notification);
    
    // 自动移除
    setTimeout(() => {
      this.remove(notification);
    }, duration);
    
    return notification;
  }
  
  // 快捷方法
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  }
  
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }
  
  error(message, duration) {
    return this.show(message, 'error', duration);
  }
  
  /**
   * 移除通知
   */
  remove(notification) {
    if (!notification || !notification.parentNode) return;
    
    notification.classList.add('closing');
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }
  
  /**
   * 清空所有通知
   */
  clear() {
    this.notifications.forEach(n => this.remove(n));
  }
}