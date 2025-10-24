/**
 * AvatarStep.js - 形象定制步骤
 * 让用户上传 LPC 角色图片
 */

export default class AvatarStep {
  constructor(container, data, onNext, onBack) {
    this.container = container;
    this.data = data;
    this.onNext = onNext;
    this.onBack = onBack;
    
    this.avatarBase64 = this.data.avatarBase64 || null;
    
    this.render();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="activation-step avatar-step">
        <!-- 标题 -->
        <h2 class="step-title">定制你的形象</h2>
        <p class="step-subtitle">上传你的像素风角色图片</p>
        
        <!-- 预览区域 -->
        <div class="avatar-preview-box" id="avatar-preview-box">
          ${this.avatarBase64 
            ? `<img src="${this.avatarBase64}" class="avatar-preview-image" id="avatar-preview" />`
            : `
              <div class="avatar-placeholder">
                <div class="avatar-placeholder-icon">🎨</div>
                <div class="avatar-placeholder-text">点击下方按钮上传图片</div>
              </div>
            `
          }
        </div>
        
        <!-- 操作区域 -->
        <div class="step-content">
          <!-- 上传按钮 -->
          <div class="avatar-upload-area">
            <input
              type="file"
              id="avatar-input"
              accept="image/png,image/jpg,image/jpeg"
              style="display: none;"
            />
            <button class="avatar-upload-btn" id="upload-btn">
              📁 选择图片
            </button>
            
            <div class="avatar-or">或</div>
            
            <a 
              href="https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/"
              target="_blank"
              class="avatar-generator-link"
            >
              🎨 前往角色生成器 →
            </a>
          </div>
          
          <!-- 说明 -->
          <div class="avatar-info">
            <div class="info-title">📖 使用说明</div>
            <div class="info-content">
              <p>1. 点击上方链接打开 LPC 角色生成器</p>
              <p>2. 定制你喜欢的角色外观</p>
              <p>3. 点击 "Download" 下载 PNG 图片</p>
              <p>4. 回到这里上传下载的图片</p>
            </div>
          </div>
          
          <!-- 提示 -->
          <div class="avatar-tips">
            <div class="tip-item">💡 支持 PNG/JPG 格式</div>
            <div class="tip-item">💡 文件大小不超过 2MB</div>
            <div class="tip-item">💡 暂不上传将使用默认形象</div>
          </div>
        </div>
        
        <!-- 按钮 -->
        <div class="step-buttons">
          <button class="step-button step-button-secondary" id="avatar-back-btn">
            ← 返回
          </button>
          <button class="step-button" id="avatar-skip-btn">
            ${this.avatarBase64 ? '继续 →' : '跳过此步 →'}
          </button>
        </div>
      </div>
    `;
    
    this.bindEvents();
  }
  
  bindEvents() {
    const uploadBtn = document.getElementById('upload-btn');
    const input = document.getElementById('avatar-input');
    const skipBtn = document.getElementById('avatar-skip-btn');
    const backBtn = document.getElementById('avatar-back-btn');
    
    // 点击上传按钮
    uploadBtn.addEventListener('click', () => {
      input.click();
    });
    
    // 文件选择
    input.addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0]);
    });
    
    // 跳过/继续
    skipBtn.addEventListener('click', () => {
      this.onNext({ avatarBase64: this.avatarBase64 });
    });
    
    // 返回
    backBtn.addEventListener('click', () => this.onBack());
  }
  
  handleFileUpload(file) {
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.match('image/(png|jpg|jpeg)')) {
      this.showError('请上传 PNG 或 JPG 格式的图片');
      return;
    }
    
    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      this.showError('图片大小不能超过 2MB');
      return;
    }
    
    // 读取文件
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const base64 = e.target.result;
      
      // 验证图片尺寸（可选）
      const img = new Image();
      img.onload = () => {
        console.log(`✅ 图片已加载: ${img.width}x${img.height}`);
        
        // 保存并更新预览
        this.avatarBase64 = base64;
        this.updatePreview(base64);
        
        // 更新按钮文字
        document.getElementById('avatar-skip-btn').textContent = '继续 →';
      };
      
      img.onerror = () => {
        this.showError('图片加载失败，请重试');
      };
      
      img.src = base64;
    };
    
    reader.onerror = () => {
      this.showError('文件读取失败，请重试');
    };
    
    reader.readAsDataURL(file);
  }
  
  updatePreview(base64) {
    const previewBox = document.getElementById('avatar-preview-box');
    previewBox.innerHTML = `
      <img src="${base64}" class="avatar-preview-image" id="avatar-preview" />
      <button class="avatar-remove-btn" id="remove-avatar-btn">✕ 重新上传</button>
    `;
    
    // 绑定删除按钮
    document.getElementById('remove-avatar-btn').addEventListener('click', () => {
      this.avatarBase64 = null;
      this.render();
    });
  }
  
  showError(message) {
    // 简单的错误提示
    alert(`⚠️ ${message}`);
  }
  
  destroy() {
    // 清理
  }
}

// 添加头像步骤样式
if (!document.getElementById('avatar-step-styles')) {
  const style = document.createElement('style');
  style.id = 'avatar-step-styles';
  style.textContent = `
    .avatar-preview-box {
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid var(--ui-border);
      padding: 20px;
      margin: 20px 0;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .avatar-placeholder {
      text-align: center;
    }
    
    .avatar-placeholder-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.3;
    }
    
    .avatar-placeholder-text {
      font-size: 12px;
      color: #8b6f47;
    }
    
    .avatar-preview-image {
      max-width: 100%;
      max-height: 300px;
      image-rendering: pixelated;
      border: 2px solid var(--accent);
    }
    
    .avatar-remove-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: var(--error);
      border: 2px solid var(--primary-bg);
      color: white;
      font-size: 12px;
      padding: 6px 12px;
      cursor: pointer;
      font-family: var(--font-pixel-cn);
    }
    
    .avatar-remove-btn:hover {
      transform: scale(1.05);
    }
    
    .avatar-upload-area {
      text-align: center;
      padding: 20px 0;
    }
    
    .avatar-upload-btn {
      background: var(--accent);
      border: 3px solid var(--ui-border);
      color: var(--primary-bg);
      font-family: var(--font-pixel-cn);
      font-size: 14px;
      padding: 12px 24px;
      cursor: pointer;
      display: inline-block;
      
      box-shadow: 
        inset -2px -2px 0 rgba(0, 0, 0, 0.3),
        4px 4px 0 rgba(0, 0, 0, 0.4);
      
      transition: all 0.15s;
    }
    
    .avatar-upload-btn:hover {
      transform: translate(-2px, -2px);
      box-shadow: 
        inset -2px -2px 0 rgba(0, 0, 0, 0.3),
        6px 6px 0 rgba(0, 0, 0, 0.5);
    }
    
    .avatar-or {
      font-size: 12px;
      color: #8b6f47;
      margin: 16px 0;
    }
    
    .avatar-generator-link {
      display: inline-block;
      color: var(--info);
      font-size: 13px;
      text-decoration: none;
      font-family: var(--font-pixel-cn);
      border-bottom: 2px solid var(--info);
      padding-bottom: 2px;
      transition: all 0.2s;
    }
    
    .avatar-generator-link:hover {
      color: var(--accent);
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    
    .avatar-info {
      background: rgba(139, 111, 71, 0.2);
      border: 2px solid var(--ui-border);
      padding: 16px;
      margin: 20px 0;
    }
    
    .info-title {
      font-size: 13px;
      color: var(--accent);
      margin-bottom: 12px;
      font-family: var(--font-pixel-cn);
    }
    
    .info-content p {
      font-size: 11px;
      color: var(--primary-text);
      margin: 8px 0;
      line-height: 1.6;
      padding-left: 16px;
      position: relative;
    }
    
    .info-content p::before {
      content: '→';
      position: absolute;
      left: 0;
      color: var(--accent);
    }
    
    .avatar-tips {
      background: rgba(91, 110, 225, 0.1);
      border: 2px solid var(--info);
      padding: 16px;
      margin-top: 20px;
    }
  `;
  document.head.appendChild(style);
}