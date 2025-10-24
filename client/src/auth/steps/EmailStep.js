/**
 * EmailStep.js - 邮箱绑定步骤
 */

export default class EmailStep {
  constructor(container, data, onNext, onBack) {
    this.container = container;
    this.data = data;
    this.onNext = onNext;
    this.onBack = onBack;
    
    this.render();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="activation-step email-step">
        <!-- 标题 -->
        <h2 class="step-title">绑定联系邮箱</h2>
        <p class="step-subtitle">用于账号找回和重要通知（不验证）</p>
        
        <!-- 邮箱图标装饰 -->
        <div class="email-icon-box">
          <span class="email-icon">📧</span>
        </div>
        
        <!-- 输入区域 -->
        <div class="step-content">
          <div class="email-input-group">
            <label for="email-input" class="email-label">邮箱地址</label>
            <input
              type="email"
              id="email-input"
              class="email-input"
              placeholder="example@domain.com"
              value="${this.data.email || ''}"
            />
            <div class="email-error hidden" id="email-error"></div>
          </div>
          
          <!-- 说明 -->
          <div class="email-info">
            <div class="info-item">💡 邮箱仅用于联系，不会发送验证码</div>
            <div class="info-item">💡 建议使用常用邮箱地址</div>
            <div class="info-item">💡 后续可在设置中修改</div>
          </div>
        </div>
        
        <!-- 按钮 -->
        <div class="step-buttons">
          <button class="step-button step-button-secondary" id="email-back-btn">
            ← 返回
          </button>
          <button class="step-button" id="email-next-btn" disabled>
            下一步 →
          </button>
        </div>
      </div>
    `;
    
    this.bindEvents();
    
    // 🔧 关键修复：如果已有数据，立即验证并启用按钮
    setTimeout(() => {
      const input = document.getElementById('email-input');
      if (input.value.trim()) {
        // 触发 input 事件进行验证
        input.dispatchEvent(new Event('input'));
      }
      // 自动聚焦
      input.focus();
    }, 100);
  }
  
  bindEvents() {
    const input = document.getElementById('email-input');
    const nextBtn = document.getElementById('email-next-btn');
    const backBtn = document.getElementById('email-back-btn');
    const error = document.getElementById('email-error');
    
    // 输入验证
    input.addEventListener('input', () => {
      const value = input.value.trim();
      const validation = this.validateEmail(value);
      
      if (validation.valid) {
        error.classList.add('hidden');
        nextBtn.disabled = false;
      } else {
        error.textContent = validation.message;
        error.classList.remove('hidden');
        nextBtn.disabled = true;
      }
    });
    
    // 回车提交
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !nextBtn.disabled) {
        this.handleNext();
      }
    });
    
    // 下一步
    nextBtn.addEventListener('click', () => this.handleNext());
    
    // 返回
    backBtn.addEventListener('click', () => this.onBack());
  }
  
  validateEmail(email) {
    if (!email || email.length === 0) {
      return { valid: false, message: '请输入邮箱地址' };
    }
    
    // 简单的邮箱格式验证
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return { valid: false, message: '请输入有效的邮箱格式' };
    }
    
    if (email.length > 100) {
      return { valid: false, message: '邮箱地址过长' };
    }
    
    return { valid: true };
  }
  
  handleNext() {
    const email = document.getElementById('email-input').value.trim();
    const validation = this.validateEmail(email);
    
    if (validation.valid) {
      console.log('✅ 邮箱地址:', email);
      this.onNext({ email: email });
    }
  }
  
  destroy() {
    // 清理
  }
}

// 添加邮箱步骤样式
if (!document.getElementById('email-step-styles')) {
  const style = document.createElement('style');
  style.id = 'email-step-styles';
  style.textContent = `
    .email-icon-box {
      text-align: center;
      margin: 20px 0;
    }
    
    .email-icon {
      font-size: 64px;
      display: inline-block;
      animation: emailFloat 3s ease-in-out infinite;
    }
    
    @keyframes emailFloat {
      0%, 100% { transform: translateY(0) rotate(-5deg); }
      50% { transform: translateY(-10px) rotate(5deg); }
    }
    
    .email-input-group {
      margin: 20px 0;
    }
    
    .email-label {
      display: block;
      font-size: 12px;
      color: var(--accent);
      margin-bottom: 8px;
      font-family: var(--font-pixel-cn);
    }
    
    .email-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid var(--ui-border);
      color: var(--primary-text);
      font-family: var(--font-pixel-en);
      font-size: 14px;
      padding: 14px 16px;
      outline: none;
      
      box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.3);
      transition: all 0.2s;
    }
    
    .email-input:focus {
      border-color: var(--accent);
      background: rgba(0, 0, 0, 0.7);
      box-shadow: 
        inset 2px 2px 0 rgba(0, 0, 0, 0.3),
        0 0 0 3px rgba(212, 165, 116, 0.2);
    }
    
    .email-error {
      background: rgba(217, 87, 99, 0.2);
      border: 2px solid var(--error);
      color: var(--error);
      font-size: 11px;
      padding: 8px 12px;
      margin-top: 10px;
      text-align: center;
    }
    
    .email-info {
      background: rgba(91, 110, 225, 0.1);
      border: 2px solid var(--info);
      padding: 16px;
      margin-top: 20px;
    }
    
    .info-item {
      font-size: 11px;
      color: var(--primary-text);
      margin: 6px 0;
      line-height: 1.6;
    }
  `;
  document.head.appendChild(style);
}