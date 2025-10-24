/**
 * GuideStep.js - 游戏引导步骤（最终步骤）
 * 温馨的引导和祝福，仪式感满满
 */

export default class GuideStep {
  constructor(container, data, onNext, onBack) {
    this.container = container;
    this.data = data;
    this.onNext = onNext;
    this.onBack = onBack;
    
    this.render();
    this.startCelebration();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="activation-step guide-step">
        <!-- 庆祝动画 -->
        <div class="celebration-container">
          <div class="celebration-emoji">🎉</div>
          <div class="celebration-emoji">✨</div>
          <div class="celebration-emoji">🎊</div>
          <div class="celebration-emoji">⭐</div>
          <div class="celebration-emoji">💫</div>
        </div>
        
        <!-- 标题 -->
        <h2 class="step-title celebration-title">激活完成！</h2>
        <p class="step-subtitle">欢迎成为 Digital Library 的一员</p>
        
        <!-- 欢迎卡片 -->
        <div class="welcome-card">
          <div class="welcome-icon">📚</div>
          <h3 class="welcome-greeting">
            你好，<span class="welcome-name">${this.data.characterName}</span>
          </h3>
          <p class="welcome-message">
            你的专属学习空间已经准备就绪<br>
            让我们一起开启美好的学习之旅吧！
          </p>
        </div>
        
        <!-- 游戏引导 -->
        <div class="guide-section">
          <div class="guide-title">💡 入馆小贴士</div>
          <div class="guide-tips">
            <div class="guide-tip">
              <span class="tip-icon">🚪</span>
              <span class="tip-text">进入游戏后，前往<strong>闸机右侧的帮助台</strong>了解详细玩法</span>
            </div>
            <div class="guide-tip">
              <span class="tip-icon">👥</span>
              <span class="tip-text">在不同区域可以遇到其他学习伙伴</span>
            </div>
            <div class="guide-tip">
              <span class="tip-icon">📖</span>
              <span class="tip-text">自习区提供安静的专注环境</span>
            </div>
            <div class="guide-tip">
              <span class="tip-icon">💬</span>
              <span class="tip-text">讨论区可以交流学习心得</span>
            </div>
          </div>
        </div>
        
        <!-- 祝福语 -->
        <div class="blessing-card">
          <p class="blessing-text">
            "在这里，你不是一个人在学习"
          </p>
          <p class="blessing-author">—— Digital Library Team</p>
        </div>
        
        <!-- 按钮 -->
        <div class="step-buttons">
          <button class="step-button step-button-secondary" id="guide-back-btn">
            ← 返回
          </button>
          <button class="step-button guide-finish-btn" id="guide-finish-btn">
            <span class="btn-icon">🚀</span>
            <span class="btn-text">进入图书馆</span>
          </button>
        </div>
      </div>
    `;
    
    this.bindEvents();
  }
  
  bindEvents() {
    const finishBtn = document.getElementById('guide-finish-btn');
    const backBtn = document.getElementById('guide-back-btn');
    
    // 完成激活
    finishBtn.addEventListener('click', () => {
      this.playFinishAnimation(finishBtn);
    });
    
    // 返回
    backBtn.addEventListener('click', () => {
      this.onBack();
    });
  }
  
  startCelebration() {
    // 庆祝 emoji 随机飘落动画
    const emojis = document.querySelectorAll('.celebration-emoji');
    emojis.forEach((emoji, index) => {
      const delay = index * 0.2;
      const duration = 2 + Math.random() * 2;
      const startX = Math.random() * 100;
      
      emoji.style.left = startX + '%';
      emoji.style.animationDelay = delay + 's';
      emoji.style.animationDuration = duration + 's';
    });
  }
  
  playFinishAnimation(button) {
    // 按钮点击动画
    button.disabled = true;
    button.style.animation = 'buttonPulse 0.6s ease-in-out';
    
    setTimeout(() => {
      // 显示加载状态
      button.innerHTML = '<span class="btn-text">正在进入...</span>';
      
      setTimeout(() => {
        // 完成
        console.log('🎉 激活流程完成！');
        this.onNext({});
      }, 1000);
    }, 600);
  }
  
  destroy() {
    // 清理
  }
}

// 添加引导步骤样式
if (!document.getElementById('guide-step-styles')) {
  const style = document.createElement('style');
  style.id = 'guide-step-styles';
  style.textContent = `
    /* 庆祝动画容器 */
    .celebration-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 200px;
      overflow: hidden;
      pointer-events: none;
    }
    
    .celebration-emoji {
      position: absolute;
      font-size: 32px;
      animation: emojiFloat 3s ease-in infinite;
      opacity: 0;
    }
    
    @keyframes emojiFloat {
      0% {
        transform: translateY(-50px) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(250px) rotate(360deg);
        opacity: 0;
      }
    }
    
    /* 标题 */
    .celebration-title {
      margin-top: 40px;
      font-size: 24px;
      animation: titleBounce 0.8s ease-out;
    }
    
    @keyframes titleBounce {
      0% {
        transform: scale(0.5);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    /* 欢迎卡片 */
    .welcome-card {
      background: linear-gradient(135deg, rgba(212, 165, 116, 0.2), rgba(212, 165, 116, 0.1));
      border: 3px solid var(--accent);
      border-radius: 8px;
      padding: 30px 20px;
      margin: 30px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);
      animation: cardSlideIn 0.6s ease-out 0.3s both;
    }
    
    .welcome-icon {
      font-size: 64px;
      margin-bottom: 16px;
      animation: iconSpin 1s ease-in-out;
    }
    
    @keyframes iconSpin {
      0% { transform: rotate(-180deg) scale(0); }
      100% { transform: rotate(0deg) scale(1); }
    }
    
    .welcome-greeting {
      font-size: 18px;
      color: var(--accent);
      margin: 12px 0;
      font-family: var(--font-pixel-cn);
    }
    
    .welcome-name {
      color: var(--primary-text);
      font-weight: bold;
      font-size: 20px;
    }
    
    .welcome-message {
      font-size: 12px;
      color: var(--primary-text);
      line-height: 1.8;
      margin: 12px 0;
      font-family: var(--font-pixel-cn);
    }
    
    /* 引导区域 */
    .guide-section {
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid var(--ui-border);
      padding: 20px;
      margin: 20px 0;
      animation: cardSlideIn 0.6s ease-out 0.5s both;
    }
    
    .guide-title {
      font-size: 14px;
      color: var(--accent);
      margin-bottom: 16px;
      font-family: var(--font-pixel-cn);
      text-align: center;
    }
    
    .guide-tips {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .guide-tip {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.2);
      border-left: 3px solid var(--accent);
      transition: all 0.2s;
    }
    
    .guide-tip:hover {
      background: rgba(212, 165, 116, 0.1);
      transform: translateX(4px);
    }
    
    .tip-icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    
    .tip-text {
      font-size: 11px;
      color: var(--primary-text);
      line-height: 1.6;
      font-family: var(--font-pixel-cn);
    }
    
    .tip-text strong {
      color: var(--accent);
      font-weight: bold;
    }
    
    /* 祝福卡片 */
    .blessing-card {
      text-align: center;
      padding: 24px;
      margin: 24px 0;
      background: rgba(91, 110, 225, 0.1);
      border: 2px solid var(--info);
      border-radius: 8px;
      animation: cardSlideIn 0.6s ease-out 0.7s both;
    }
    
    .blessing-text {
      font-size: 14px;
      color: var(--primary-text);
      font-style: italic;
      margin: 0 0 12px 0;
      font-family: var(--font-pixel-cn);
      line-height: 1.8;
    }
    
    .blessing-author {
      font-size: 11px;
      color: var(--accent);
      margin: 0;
      font-family: var(--font-pixel-cn);
    }
    
    /* 完成按钮特殊样式 */
    .guide-finish-btn {
      background: linear-gradient(135deg, var(--success), #5da825);
      font-size: 16px;
      padding: 14px 32px;
      position: relative;
      overflow: hidden;
    }
    
    .guide-finish-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    .guide-finish-btn:hover::before {
      width: 300px;
      height: 300px;
    }
    
    .btn-icon {
      font-size: 18px;
      margin-right: 8px;
      display: inline-block;
      animation: rocketShake 0.5s infinite;
    }
    
    @keyframes rocketShake {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    
    .btn-text {
      position: relative;
      z-index: 1;
    }
    
    @keyframes buttonPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);
}