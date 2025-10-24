/**
 * NameStep.js - 角色命名步骤
 * 让用户输入游戏中的角色名称
 */

export default class NameStep {
  constructor(container, data, onNext, onBack) {
    this.container = container;
    this.data = data;
    this.onNext = onNext;
    this.onBack = onBack;
    
    this.render();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="activation-step name-step">
        <!-- 标题 -->
        <h2 class="step-title">给自己起个名字</h2>
        <p class="step-subtitle">这将是你在图书馆中的身份标识</p>
        
        <!-- 预览区域 -->
        <div class="name-preview-box">
          <div class="name-preview-character">🧑</div>
          <div class="name-preview-text" id="name-preview">
            ${this.data.characterName || '你的名字'}
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="step-content">
          <div class="name-input-group">
            <label for="character-name" class="name-label">角色名称</label>
            <input
              type="text"
              id="character-name"
              class="name-input"
              placeholder="请输入 2-10 个字符"
              maxlength="10"
              value="${this.data.characterName || ''}"
            />
            <div class="name-hint">
              <span id="char-count">0</span>/10 字符
            </div>
            <div class="name-error hidden" id="name-error"></div>
          </div>
          
          <!-- 提示 -->
          <div class="name-tips">
            <div class="tip-item">💡 建议使用中文或英文</div>
            <div class="tip-item">💡 避免使用特殊符号</div>
            <div class="tip-item">💡 名字设置后可在设置中修改</div>
          </div>
        </div>
        
        <!-- 按钮 -->
        <div class="step-buttons">
          <button class="step-button step-button-secondary" id="name-back-btn">
            ← 返回
          </button>
          <button class="step-button" id="name-next-btn" disabled>
            下一步 →
          </button>
        </div>
      </div>
    `;
    
    this.bindEvents();
    this.updateCharCount();
    
    // 🔧 关键修复：如果已有数据，立即验证并启用按钮
    setTimeout(() => {
      const input = document.getElementById('character-name');
      if (input.value.trim()) {
        // 触发 input 事件进行验证
        input.dispatchEvent(new Event('input'));
      }
      // 自动聚焦
      input.focus();
    }, 100);
  }
  
  bindEvents() {
    const input = document.getElementById('character-name');
    const nextBtn = document.getElementById('name-next-btn');
    const backBtn = document.getElementById('name-back-btn');
    const preview = document.getElementById('name-preview');
    const error = document.getElementById('name-error');
    
    // 输入实时预览
    input.addEventListener('input', () => {
      const value = input.value.trim();
      
      // 更新预览
      preview.textContent = value || '你的名字';
      
      // 更新字符计数
      this.updateCharCount();
      
      // 验证
      const validation = this.validateName(value);
      
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
  
  validateName(name) {
    if (!name || name.length === 0) {
      return { valid: false, message: '请输入角色名称' };
    }
    
    if (name.length < 2) {
      return { valid: false, message: '名称至少需要 2 个字符' };
    }
    
    if (name.length > 10) {
      return { valid: false, message: '名称不能超过 10 个字符' };
    }
    
    // 检查特殊字符（允许中文、英文、数字、空格）
    const validPattern = /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/;
    if (!validPattern.test(name)) {
      return { valid: false, message: '名称只能包含中文、英文和数字' };
    }
    
    return { valid: true };
  }
  
  updateCharCount() {
    const input = document.getElementById('character-name');
    const count = document.getElementById('char-count');
    count.textContent = input.value.length;
  }
  
  handleNext() {
    const name = document.getElementById('character-name').value.trim();
    const validation = this.validateName(name);
    
    if (validation.valid) {
      console.log('✅ 角色名称:', name);
      this.onNext({ characterName: name });
    }
  }
  
  destroy() {
    // 清理
  }
}

// 添加命名步骤样式
if (!document.getElementById('name-step-styles')) {
  const style = document.createElement('style');
  style.id = 'name-step-styles';
  style.textContent = `
    .name-preview-box {
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid var(--ui-border);
      padding: 30px;
      margin: 20px 0;
      text-align: center;
    }
    
    .name-preview-character {
      font-size: 64px;
      margin-bottom: 16px;
      animation: characterBounce 2s ease-in-out infinite;
    }
    
    @keyframes characterBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    
    .name-preview-text {
      font-size: 20px;
      color: var(--accent);
      font-family: var(--font-pixel-cn);
      font-weight: bold;
      text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
      min-height: 28px;
    }
    
    .name-input-group {
      margin: 20px 0;
    }
    
    .name-label {
      display: block;
      font-size: 12px;
      color: var(--accent);
      margin-bottom: 8px;
      font-family: var(--font-pixel-cn);
    }
    
    .name-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid var(--ui-border);
      color: var(--primary-text);
      font-family: var(--font-pixel-cn);
      font-size: 16px;
      padding: 14px 16px;
      outline: none;
      text-align: center;
      
      box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.3);
      transition: all 0.2s;
    }
    
    .name-input:focus {
      border-color: var(--accent);
      background: rgba(0, 0, 0, 0.7);
      box-shadow: 
        inset 2px 2px 0 rgba(0, 0, 0, 0.3),
        0 0 0 3px rgba(212, 165, 116, 0.2);
    }
    
    .name-hint {
      text-align: right;
      font-size: 10px;
      color: #8b6f47;
      margin-top: 6px;
      font-family: var(--font-pixel-en);
    }
    
    .name-error {
      background: rgba(217, 87, 99, 0.2);
      border: 2px solid var(--error);
      color: var(--error);
      font-size: 11px;
      padding: 8px 12px;
      margin-top: 10px;
      text-align: center;
    }
    
    .name-tips {
      background: rgba(91, 110, 225, 0.1);
      border: 2px solid var(--info);
      padding: 16px;
      margin-top: 20px;
    }
    
    .tip-item {
      font-size: 11px;
      color: var(--primary-text);
      margin: 6px 0;
      line-height: 1.6;
    }
  `;
  document.head.appendChild(style);
}