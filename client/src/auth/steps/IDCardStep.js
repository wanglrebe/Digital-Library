/**
 * IDCardStep.js - 生成 ID 卡步骤
 * 展示用户的专属 ID 卡，从 LPC 精灵图裁切证件照
 */

export default class IDCardStep {
  constructor(container, data, onNext, onBack) {
    this.container = container;
    this.data = data;
    this.onNext = onNext;
    this.onBack = onBack;
    
    // 生成唯一 ID
    this.userId = this.generateUserId();
    this.joinDate = new Date().toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    
    this.isGenerating = true;
    this.idPhotoBase64 = null; // 裁切后的证件照
    
    this.render();
    this.startGeneratingAnimation();
  }
  
  generateUserId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `DL-${timestamp.slice(-4)}${random}`;
  }
  
  /**
   * 从 LPC 精灵图裁切证件照
   * LPC 标准格式：每帧 64x64，正面静止帧在第 33 行第 1 列（索引从0开始：row=32, col=0）
   */
  async cropIdPhoto() {
    if (!this.data.avatarBase64) {
      return null;
    }
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // 创建 canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // LPC 标准：64x64 每帧
        const frameWidth = 64;
        const frameHeight = 64;
        
        // 正面静止帧位置：第 11 行（索引 10），第 1 列（索引 0）
        // 这是 idle-down 的第一帧
        const row = 32;  // 第 33 行（0-indexed）
        const col = 0;   // 第 1 列
        
        const sourceX = col * frameWidth;
        const sourceY = row * frameHeight;
        
        // 裁切头部区域（从肩部以上，约 40x40 像素）
        const headWidth = 40;
        const headHeight = 40;
        const headOffsetX = 12; // 头部在帧中的 X 偏移
        const headOffsetY = 8;  // 头部在帧中的 Y 偏移
        
        // 设置输出尺寸（放大到 80x80）
        canvas.width = 80;
        canvas.height = 80;
        
        // 绘制裁切的头部并放大
        ctx.imageSmoothingEnabled = false; // 保持像素风格
        ctx.drawImage(
          img,
          sourceX + headOffsetX,  // 源 X（帧内头部位置）
          sourceY + headOffsetY,  // 源 Y
          headWidth,              // 源宽度
          headHeight,             // 源高度
          0,                      // 目标 X
          0,                      // 目标 Y
          80,                     // 目标宽度（放大）
          80                      // 目标高度（放大）
        );
        
        // 转换为 Base64
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => {
        console.error('❌ 头像加载失败');
        resolve(null);
      };
      
      img.src = this.data.avatarBase64;
    });
  }
  
  render() {
    this.container.innerHTML = `
      <div class="activation-step idcard-step">
        <!-- 标题 -->
        <h2 class="step-title">生成专属 ID 卡</h2>
        <p class="step-subtitle">你的数字图书馆通行证</p>
        
        <!-- 生成动画区域 -->
        <div class="idcard-generating" id="idcard-generating">
          <div class="generating-icon">🎫</div>
          <div class="generating-text">正在生成 ID 卡...</div>
          <div class="generating-progress">
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <div class="progress-percent" id="progress-percent">0%</div>
          </div>
        </div>
        
        <!-- ID 卡预览（初始隐藏） -->
        <div class="idcard-preview hidden" id="idcard-preview">
          <div class="idcard">
            <!-- 卡片头部 -->
            <div class="idcard-header">
              <div class="idcard-logo">📚</div>
              <div class="idcard-title">
                <div class="idcard-title-main">Digital Library</div>
                <div class="idcard-title-sub">ID Card</div>
              </div>
            </div>
            
            <!-- 分隔线 -->
            <div class="idcard-divider"></div>
            
            <!-- 卡片主体 -->
            <div class="idcard-body">
              <div class="idcard-photo" id="idcard-photo-container">
                <div class="idcard-avatar-placeholder">🧑</div>
              </div>
              
              <div class="idcard-info">
                <div class="idcard-field">
                  <span class="field-label">姓名</span>
                  <span class="field-value">${this.data.characterName}</span>
                </div>
                
                <div class="idcard-field">
                  <span class="field-label">ID</span>
                  <span class="field-value id-number">${this.userId}</span>
                </div>
                
                <div class="idcard-field">
                  <span class="field-label">邮箱</span>
                  <span class="field-value">${this.data.email}</span>
                </div>
                
                <div class="idcard-field">
                  <span class="field-label">入馆日期</span>
                  <span class="field-value">${this.joinDate}</span>
                </div>
              </div>
            </div>
            
            <!-- 卡片底部 -->
            <div class="idcard-footer">
              <div class="idcard-hologram">✨</div>
              <div class="idcard-notice">
                此卡用于开启闸机和房间门锁，请妥善保管
              </div>
            </div>
          </div>
          
          <!-- 下载提示 -->
          <div class="idcard-download-hint">
            <button class="download-btn" id="download-btn">
              💾 下载 ID 卡
            </button>
            <p class="download-text">可将 ID 卡保存为纪念</p>
          </div>
        </div>
        
        <!-- 按钮 -->
        <div class="step-buttons" id="step-buttons">
          <button class="step-button step-button-secondary" id="idcard-back-btn" disabled>
            ← 返回
          </button>
          <button class="step-button" id="idcard-next-btn" disabled>
            下一步 →
          </button>
        </div>
      </div>
    `;
  }
  
  async startGeneratingAnimation() {
    const fill = document.getElementById('progress-fill');
    const percent = document.getElementById('progress-percent');
    let progress = 0;
    
    // 如果有头像，先裁切证件照
    if (this.data.avatarBase64) {
      this.idPhotoBase64 = await this.cropIdPhoto();
      console.log('📸 证件照已裁切');
    }
    
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      
      if (progress >= 100) {
        progress = 100;
        fill.style.width = '100%';
        percent.textContent = '100%';
        clearInterval(interval);
        
        // 显示 ID 卡
        setTimeout(() => {
          this.showIdCard();
        }, 500);
      } else {
        fill.style.width = progress + '%';
        percent.textContent = Math.floor(progress) + '%';
      }
    }, 200);
  }
  
  showIdCard() {
    const generating = document.getElementById('idcard-generating');
    const preview = document.getElementById('idcard-preview');
    const photoContainer = document.getElementById('idcard-photo-container');
    const nextBtn = document.getElementById('idcard-next-btn');
    const backBtn = document.getElementById('idcard-back-btn');
    
    // 更新证件照
    if (this.idPhotoBase64) {
      photoContainer.innerHTML = `<img src="${this.idPhotoBase64}" class="idcard-avatar" />`;
    }
    
    // 隐藏生成动画
    generating.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      generating.classList.add('hidden');
      
      // 显示 ID 卡（带动画）
      preview.classList.remove('hidden');
      preview.style.animation = 'idcardAppear 0.8s ease-out';
      
      // 启用按钮
      nextBtn.disabled = false;
      backBtn.disabled = false;
      
      // 绑定事件
      this.bindEvents();
      
      this.isGenerating = false;
    }, 300);
  }
  
  bindEvents() {
    const nextBtn = document.getElementById('idcard-next-btn');
    const backBtn = document.getElementById('idcard-back-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    // 下载 ID 卡
    downloadBtn.addEventListener('click', () => {
      this.downloadIdCard();
    });
    
    // 下一步
    nextBtn.addEventListener('click', () => {
      this.onNext({});
    });
    
    // 返回
    backBtn.addEventListener('click', () => {
      this.onBack();
    });
  }
  
  downloadIdCard() {
    // 实际应用中可以使用 html2canvas 截图整个卡片
    // 这里简化处理
    alert('💾 ID 卡下载功能\n\n实际应用中会将 ID 卡保存为图片。\n当前为演示版本。');
    
    console.log('📥 下载 ID 卡:', {
      userId: this.userId,
      name: this.data.characterName,
      email: this.data.email,
      joinDate: this.joinDate,
      idPhoto: this.idPhotoBase64 ? '已裁切' : '默认头像'
    });
  }
  
  destroy() {
    // 清理
  }
}

// 添加 ID 卡步骤样式
if (!document.getElementById('idcard-step-styles')) {
  const style = document.createElement('style');
  style.id = 'idcard-step-styles';
  style.textContent = `
    /* 生成动画 */
    .idcard-generating {
      text-align: center;
      padding: 60px 20px;
    }
    
    .generating-icon {
      font-size: 80px;
      margin-bottom: 20px;
      animation: cardSpin 2s linear infinite;
    }
    
    @keyframes cardSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .generating-text {
      font-size: 14px;
      color: var(--accent);
      margin-bottom: 30px;
      font-family: var(--font-pixel-cn);
    }
    
    .generating-progress {
      max-width: 300px;
      margin: 0 auto;
    }
    
    .progress-bar {
      height: 12px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid var(--ui-border);
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      width: 0;
      background: linear-gradient(90deg, var(--accent), var(--success));
      transition: width 0.2s ease;
      animation: progressShine 1.5s infinite;
    }
    
    @keyframes progressShine {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .progress-percent {
      font-size: 12px;
      color: var(--primary-text);
      margin-top: 8px;
      font-family: var(--font-pixel-en);
    }
    
    @keyframes fadeOut {
      to { opacity: 0; transform: scale(0.95); }
    }
    
    /* ID 卡预览 */
    .idcard-preview {
      margin: 20px 0;
    }
    
    @keyframes idcardAppear {
      0% {
        opacity: 0;
        transform: translateY(30px) scale(0.9);
      }
      60% {
        transform: translateY(-5px) scale(1.02);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    /* ID 卡主体 */
    .idcard {
      background: linear-gradient(135deg, #f4e8d0 0%, #e8dcc8 100%);
      border: 4px solid var(--ui-border);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 
        0 8px 16px rgba(0, 0, 0, 0.4),
        inset 0 0 20px rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .idcard::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 70%
      );
      animation: cardGloss 3s infinite;
    }
    
    @keyframes cardGloss {
      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
      100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    }
    
    /* 卡片头部 */
    .idcard-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .idcard-logo {
      font-size: 36px;
      filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.2));
    }
    
    .idcard-title-main {
      font-family: var(--font-pixel-en);
      font-size: 16px;
      color: var(--primary-bg);
      font-weight: bold;
      letter-spacing: 1px;
    }
    
    .idcard-title-sub {
      font-family: var(--font-pixel-en);
      font-size: 9px;
      color: #8b6f47;
      letter-spacing: 2px;
    }
    
    .idcard-divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--ui-border), transparent);
      margin: 16px 0;
    }
    
    /* 卡片主体 */
    .idcard-body {
      display: flex;
      gap: 16px;
      margin: 16px 0;
    }
    
    .idcard-photo {
      flex-shrink: 0;
    }
    
    .idcard-avatar {
      width: 80px;
      height: 80px;
      border: 3px solid var(--ui-border);
      background: rgba(0, 0, 0, 0.1);
      image-rendering: pixelated;
      object-fit: cover;
      display: block;
    }
    
    .idcard-avatar-placeholder {
      width: 80px;
      height: 80px;
      border: 3px solid var(--ui-border);
      background: rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
    
    .idcard-info {
      flex: 1;
    }
    
    .idcard-field {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 11px;
    }
    
    .field-label {
      color: #8b6f47;
      font-family: var(--font-pixel-cn);
    }
    
    .field-value {
      color: var(--primary-bg);
      font-family: var(--font-pixel-cn);
      font-weight: bold;
    }
    
    .id-number {
      font-family: var(--font-pixel-en);
      letter-spacing: 1px;
    }
    
    /* 卡片底部 */
    .idcard-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 2px dashed var(--ui-border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .idcard-hologram {
      font-size: 20px;
      animation: hologramSparkle 2s infinite;
    }
    
    @keyframes hologramSparkle {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    
    .idcard-notice {
      flex: 1;
      font-size: 9px;
      color: var(--primary-bg);
      font-family: var(--font-pixel-cn);
      line-height: 1.4;
      font-weight: bold;
    }
    
    /* 下载提示 */
    .idcard-download-hint {
      text-align: center;
      margin-top: 20px;
    }
    
    .download-btn {
      background: var(--info);
      border: 3px solid var(--ui-border);
      color: white;
      font-family: var(--font-pixel-cn);
      font-size: 13px;
      padding: 10px 20px;
      cursor: pointer;
      
      box-shadow: 
        inset -2px -2px 0 rgba(0, 0, 0, 0.3),
        4px 4px 0 rgba(0, 0, 0, 0.4);
      
      transition: all 0.15s;
    }
    
    .download-btn:hover {
      transform: translate(-2px, -2px);
      box-shadow: 
        inset -2px -2px 0 rgba(0, 0, 0, 0.3),
        6px 6px 0 rgba(0, 0, 0, 0.5);
    }
    
    .download-text {
      font-size: 10px;
      color: #8b6f47;
      margin-top: 8px;
    }
  `;
  document.head.appendChild(style);
}