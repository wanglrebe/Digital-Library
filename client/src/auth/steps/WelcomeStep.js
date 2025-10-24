/**
 * WelcomeStep.js - 欢迎介绍步骤
 * 展示项目介绍、愿景和团队信息
 */

export default class WelcomeStep {
  constructor(container, data, onNext, onBack) {
    this.container = container;
    this.data = data;
    this.onNext = onNext;
    this.onBack = onBack;
    
    this.render();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="activation-step welcome-step">
        <!-- Logo -->
        <div class="welcome-logo">
          <span class="welcome-logo-icon">📚</span>
        </div>
        
        <!-- 标题 -->
        <h2 class="step-title">欢迎来到 Digital Library</h2>
        <p class="step-subtitle">像素风虚拟自习室</p>
        
        <!-- 内容区域 -->
        <div class="step-content">
          <div class="welcome-section">
            <div class="welcome-section-icon">🏛️</div>
            <h3 class="welcome-section-title">关于图书馆</h3>
            <p class="welcome-section-text">
              这是一个基于格拉斯哥大学图书馆记忆打造的 2.5D 像素风虚拟学习空间。
              在这里，你可以专注学习，也可以与志同道合的伙伴交流。
            </p>
          </div>
          
          <div class="welcome-section">
            <div class="welcome-section-icon">💡</div>
            <h3 class="welcome-section-title">我们的初衷</h3>
            <p class="welcome-section-text">
              提供有温度的陪伴感，而不打扰专注。
              让远程学习也能感受到真实的学习氛围。
            </p>
          </div>
          
          <div class="welcome-section">
            <div class="welcome-section-icon">👥</div>
            <h3 class="welcome-section-title">创作团队</h3>
            <p class="welcome-section-text">
              由格拉斯哥大学的同学们用心打造
              <br>
              <span class="team-signature">—— Digital Library Team</span>
            </p>
          </div>
        </div>
        
        <!-- 按钮 -->
        <div class="step-buttons">
          <button class="step-button" id="welcome-next-btn">
            开始激活 →
          </button>
        </div>
        
        <!-- 底部提示 -->
        <div class="welcome-footer">
          <p>🔒 纯内部邀请制 · 安全可信赖</p>
        </div>
      </div>
    `;
    
    // 绑定事件
    this.bindEvents();
    
    // 入场动画
    this.playAnimation();
  }
  
  bindEvents() {
    const nextBtn = document.getElementById('welcome-next-btn');
    nextBtn.addEventListener('click', () => {
      // 欢迎页不需要收集数据，直接进入下一步
      this.onNext({});
    });
  }
  
  playAnimation() {
    // Logo 动画
    const logo = this.container.querySelector('.welcome-logo-icon');
    logo.style.animation = 'logoFloat 3s ease-in-out infinite';
    
    // 内容区域依次淡入
    const sections = this.container.querySelectorAll('.welcome-section');
    sections.forEach((section, index) => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        section.style.transition = 'all 0.5s ease-out';
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
      }, 300 + index * 150);
    });
  }
  
  destroy() {
    // 清理事件监听器
  }
}

// 添加欢迎页样式（动态注入）
if (!document.getElementById('welcome-step-styles')) {
  const style = document.createElement('style');
  style.id = 'welcome-step-styles';
  style.textContent = `
    .welcome-logo {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .welcome-logo-icon {
      font-size: 72px;
      display: inline-block;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      animation: logoFloat 3s ease-in-out infinite;
    }
    
    .welcome-section {
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid var(--ui-border);
      padding: 20px;
      margin: 16px 0;
      text-align: center;
    }
    
    .welcome-section-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }
    
    .welcome-section-title {
      font-size: 14px;
      color: var(--accent);
      margin: 0 0 12px 0;
      font-family: var(--font-pixel-cn);
    }
    
    .welcome-section-text {
      font-size: 12px;
      color: var(--primary-text);
      line-height: 1.8;
      margin: 0;
      font-family: var(--font-pixel-cn);
    }
    
    .team-signature {
      color: var(--accent);
      font-style: italic;
      font-size: 11px;
    }
    
    .welcome-footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid var(--ui-border);
    }
    
    .welcome-footer p {
      font-size: 10px;
      color: #8b6f47;
      margin: 0;
    }
  `;
  document.head.appendChild(style);
}