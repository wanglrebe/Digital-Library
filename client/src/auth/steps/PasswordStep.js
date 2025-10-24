/**
 * PasswordStep.js - 设置密码步骤
 */

export default class PasswordStep {
  constructor(container, data, onNext, onBack) {
    this.container = container;
    this.data = data;
    this.onNext = onNext;
    this.onBack = onBack;
    
    this.showPassword = false;
    
    this.render();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="activation-step password-step">
        <!-- 标题 -->
        <h2 class="step-title">设置登录密码</h2>
        <p class="step-subtitle">用于保护你的账号安全</p>
        
        <!-- 密码图标装饰 -->
        <div class="password-icon-box">
          <span class="password-icon">🔐</span>
        </div>
        
        <!-- 输入区域 -->
        <div class="step-content">
          <!-- 新密码 -->
          <div class="password-input-group">
            <label for="password-input" class="password-label">新密码</label>
            <div class="password-input-wrapper">
              <input
                type="password"
                id="password-input"
                class="password-input"
                placeholder="请输入 6-20 位密码"
                maxlength="20"
              />
              <button class="password-toggle" id="toggle-password" type="button">
                👁️
              </button>
            </div>
          </div>
          
          <!-- 确认密码 -->
          <div class="password-input-group">
            <label for="password-confirm" class="password-label">确认密码</label>
            <div class="password-input-wrapper">
              <input
                type="password"
                id="password-confirm"
                class="password-input"
                placeholder="请再次输入密码"
                maxlength="20"
              />
              <button class="password-toggle" id="toggle-confirm" type="button">
                👁️
              </button>
            </div>
          </div>
          
          <div class="password-error hidden" id="password-error"></div>
          
          <!-- 密码强度指示 -->
          <div class="password-strength" id="password-strength">
            <div class="strength-label">密码强度：</div>
            <div class="strength-bar">
              <div class="strength-fill" id="strength-fill"></div>
            </div>
            <div class="strength-text" id="strength-text">未输入</div>
          </div>
          
          <!-- 提示 -->
          <div class="password-tips">
            <div class="tip-item">💡 密码长度 6-20 位</div>
            <div class="tip-item">💡 建议包含字母和数字</div>
            <div class="tip-item">💡 避免使用过于简单的密码</div>
          </div>
        </div>
        
        <!-- 按钮 -->
        <div class="step-buttons">
          <button class="step-button step-button-secondary" id="password-back-btn">
            ← 返回
          </button>
          <button class="step-button" id="password-next-btn" disabled>
            下一步 →
          </button>
        </div>
      </div>
    `;
    
    this.bindEvents();
    
    // 自动聚焦
    setTimeout(() => {
      document.getElementById('password-input').focus();
    }, 300);
  }
  
  bindEvents() {
    const passwordInput = document.getElementById('password-input');
    const confirmInput = document.getElementById('password-confirm');
    const nextBtn = document.getElementById('password-next-btn');
    const backBtn = document.getElementById('password-back-btn');
    const error = document.getElementById('password-error');
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirm = document.getElementById('toggle-confirm');
    
    // 密码输入验证
    passwordInput.addEventListener('input', () => {
      this.updateStrength(passwordInput.value);
      this.validatePasswords();
    });
    
    // 确认密码验证
    confirmInput.addEventListener('input', () => {
      this.validatePasswords();
    });
    
    // 切换密码可见性
    togglePassword.addEventListener('click', () => {
      this.togglePasswordVisibility(passwordInput, togglePassword);
    });
    
    toggleConfirm.addEventListener('click', () => {
      this.togglePasswordVisibility(confirmInput, toggleConfirm);
    });
    
    // 回车提交
    [passwordInput, confirmInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !nextBtn.disabled) {
          this.handleNext();
        }
      });
    });
    
    // 下一步
    nextBtn.addEventListener('click', () => this.handleNext());
    
    // 返回
    backBtn.addEventListener('click', () => this.onBack());
  }
  
  togglePasswordVisibility(input, button) {
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🙈';
    } else {
      input.type = 'password';
      button.textContent = '👁️';
    }
  }
  
  updateStrength(password) {
    const fill = document.getElementById('strength-fill');
    const text = document.getElementById('strength-text');
    
    if (!password) {
      fill.style.width = '0%';
      fill.className = 'strength-fill';
      text.textContent = '未输入';
      return;
    }
    
    let strength = 0;
    
    // 长度
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    
    // 包含数字
    if (/\d/.test(password)) strength += 25;
    
    // 包含字母
    if (/[a-zA-Z]/.test(password)) strength += 25;
    
    fill.style.width = strength + '%';
    
    if (strength <= 25) {
      fill.className = 'strength-fill weak';
      text.textContent = '弱';
    } else if (strength <= 50) {
      fill.className = 'strength-fill medium';
      text.textContent = '中等';
    } else {
      fill.className = 'strength-fill strong';
      text.textContent = '强';
    }
  }
  
  validatePasswords() {
    const password = document.getElementById('password-input').value;
    const confirm = document.getElementById('password-confirm').value;
    const error = document.getElementById('password-error');
    const nextBtn = document.getElementById('password-next-btn');
    
    // 验证密码长度
    if (password.length > 0 && password.length < 6) {
      error.textContent = '⚠️ 密码至少需要 6 位';
      error.classList.remove('hidden');
      nextBtn.disabled = true;
      return;
    }
    
    // 验证两次密码是否一致
    if (confirm.length > 0 && password !== confirm) {
      error.textContent = '⚠️ 两次密码输入不一致';
      error.classList.remove('hidden');
      nextBtn.disabled = true;
      return;
    }
    
    // 检查是否都已输入
    if (password.length >= 6 && confirm.length >= 6 && password === confirm) {
      error.classList.add('hidden');
      nextBtn.disabled = false;
    } else {
      nextBtn.disabled = true;
    }
  }
  
  handleNext() {
    const password = document.getElementById('password-input').value;
    console.log('✅ 密码已设置');
    // 注意：实际应用中不应该明文传递密码
    this.onNext({ password: password });
  }
  
  destroy() {
    // 清理
  }
}

// 添加密码步骤样式
if (!document.getElementById('password-step-styles')) {
  const style = document.createElement('style');
  style.id = 'password-step-styles';
  style.textContent = `
    .password-icon-box {
      text-align: center;
      margin: 20px 0;
    }
    
    .password-icon {
      font-size: 64px;
      display: inline-block;
      animation: lockShake 1s ease-in-out infinite;
    }
    
    @keyframes lockShake {
      0%, 100% { transform: rotate(-3deg); }
      50% { transform: rotate(3deg); }
    }
    
    .password-input-group {
      margin: 16px 0;
    }
    
    .password-label {
      display: block;
      font-size: 12px;
      color: var(--accent);
      margin-bottom: 8px;
      font-family: var(--font-pixel-cn);
    }
    
    .password-input-wrapper {
      position: relative;
    }
    
    .password-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid var(--ui-border);
      color: var(--primary-text);
      font-family: var(--font-pixel-en);
      font-size: 14px;
      padding: 14px 50px 14px 16px;
      outline: none;
      
      box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.3);
      transition: all 0.2s;
    }
    
    .password-input:focus {
      border-color: var(--accent);
      background: rgba(0, 0, 0, 0.7);
      box-shadow: 
        inset 2px 2px 0 rgba(0, 0, 0, 0.3),
        0 0 0 3px rgba(212, 165, 116, 0.2);
    }
    
    .password-toggle {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
    }
    
    .password-toggle:hover {
      opacity: 1;
    }
    
    .password-error {
      background: rgba(217, 87, 99, 0.2);
      border: 2px solid var(--error);
      color: var(--error);
      font-size: 11px;
      padding: 8px 12px;
      margin-top: 10px;
      text-align: center;
    }
    
    .password-strength {
      margin: 20px 0;
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid var(--ui-border);
    }
    
    .strength-label {
      font-size: 11px;
      color: var(--primary-text);
      margin-bottom: 8px;
    }
    
    .strength-bar {
      height: 8px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid var(--ui-border);
      overflow: hidden;
    }
    
    .strength-fill {
      height: 100%;
      width: 0;
      transition: width 0.3s ease, background 0.3s ease;
      background: #666;
    }
    
    .strength-fill.weak {
      background: var(--error);
    }
    
    .strength-fill.medium {
      background: var(--warning);
    }
    
    .strength-fill.strong {
      background: var(--success);
    }
    
    .strength-text {
      font-size: 10px;
      color: var(--accent);
      margin-top: 6px;
      text-align: right;
      font-family: var(--font-pixel-cn);
    }
    
    .password-tips {
      background: rgba(91, 110, 225, 0.1);
      border: 2px solid var(--info);
      padding: 16px;
      margin-top: 20px;
    }
  `;
  document.head.appendChild(style);
}