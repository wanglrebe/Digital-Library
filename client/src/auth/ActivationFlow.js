/**
 * ActivationFlow.js - 激活流程管理器
 * 管理 7 个激活步骤的流程、数据收集和 UI 切换
 */

import { saveActivationData } from './mockAuth.js';
import WelcomeStep from './steps/WelcomeStep.js';
import NameStep from './steps/NameStep.js';
import AvatarStep from './steps/AvatarStep.js';
import EmailStep from './steps/EmailStep.js';
import PasswordStep from './steps/PasswordStep.js';
import IDCardStep from './steps/IDCardStep.js';
import GuideStep from './steps/GuideStep.js';

export default class ActivationFlow {
  constructor(onComplete) {
    this.onComplete = onComplete; // 激活完成回调
    this.container = null;
    
    // 当前步骤索引
    this.currentStepIndex = 0;
    
    // 步骤配置
    this.steps = [
      { name: 'welcome', title: '欢迎', component: WelcomeStep },
      { name: 'name', title: '角色命名', component: NameStep },
      { name: 'avatar', title: '形象定制', component: AvatarStep },
      { name: 'email', title: '绑定邮箱', component: EmailStep },
      { name: 'password', title: '设置密码', component: PasswordStep },
      { name: 'idcard', title: '生成证件', component: IDCardStep },
      { name: 'guide', title: '游戏引导', component: GuideStep }
    ];
    
    // 收集的数据
    this.data = {
      characterName: '',
      avatarBase64: null,
      email: '',
      password: ''
    };
    
    // 当前步骤组件实例
    this.currentStep = null;
    
    this.create();
  }
  
  /**
   * 创建激活流程容器
   */
  create() {
    // 创建遮罩层
    this.container = document.createElement('div');
    this.container.id = 'activation-overlay';
    this.container.className = 'activation-overlay';
    
    // 添加背景装饰（与登录界面一致）
    for (let i = 0; i < 4; i++) {
      const decoration = document.createElement('div');
      decoration.className = 'auth-decoration';
      decoration.textContent = '📚';
      this.container.appendChild(decoration);
    }
    
    // 创建主卡片
    this.card = document.createElement('div');
    this.card.className = 'activation-card';
    
    // 创建进度指示器
    this.progressBar = this.createProgressBar();
    this.card.appendChild(this.progressBar);
    
    // 创建步骤内容容器
    this.stepContainer = document.createElement('div');
    this.stepContainer.className = 'activation-step-container';
    this.card.appendChild(this.stepContainer);
    
    this.container.appendChild(this.card);
    document.body.appendChild(this.container);
    
    // 显示第一个步骤
    this.showStep(0);
    
    console.log('🔄 激活流程已创建');
  }
  
  /**
   * 创建进度指示器
   */
  createProgressBar() {
    const container = document.createElement('div');
    container.className = 'activation-progress';
    
    this.steps.forEach((step, index) => {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      dot.dataset.step = index;
      
      // 第一个步骤默认激活
      if (index === 0) {
        dot.classList.add('active');
      }
      
      // 添加提示文字
      const label = document.createElement('span');
      label.className = 'progress-label';
      label.textContent = step.title;
      dot.appendChild(label);
      
      container.appendChild(dot);
      
      // 添加连接线（最后一个不需要）
      if (index < this.steps.length - 1) {
        const line = document.createElement('div');
        line.className = 'progress-line';
        container.appendChild(line);
      }
    });
    
    return container;
  }
  
  /**
   * 显示指定步骤
   */
  showStep(index) {
    if (index < 0 || index >= this.steps.length) {
      console.error('❌ 无效的步骤索引:', index);
      return;
    }
    
    this.currentStepIndex = index;
    const stepConfig = this.steps[index];
    
    console.log(`📍 显示步骤 ${index + 1}/${this.steps.length}: ${stepConfig.title}`);
    
    // 销毁旧步骤
    if (this.currentStep && this.currentStep.destroy) {
      this.currentStep.destroy();
    }
    
    // 清空容器
    this.stepContainer.innerHTML = '';
    
    // 创建新步骤
    const StepComponent = stepConfig.component;
    this.currentStep = new StepComponent(
      this.stepContainer,
      this.data,
      (stepData) => this.handleStepComplete(stepData),
      () => this.handleStepBack()
    );
    
    // 更新进度指示器
    this.updateProgress(index);
  }
  
  /**
   * 更新进度指示器
   */
  updateProgress(currentIndex) {
    const dots = this.progressBar.querySelectorAll('.progress-dot');
    const lines = this.progressBar.querySelectorAll('.progress-line');
    
    dots.forEach((dot, index) => {
      if (index < currentIndex) {
        dot.classList.add('completed');
        dot.classList.remove('active');
      } else if (index === currentIndex) {
        dot.classList.add('active');
        dot.classList.remove('completed');
      } else {
        dot.classList.remove('active', 'completed');
      }
    });
    
    lines.forEach((line, index) => {
      if (index < currentIndex) {
        line.classList.add('completed');
      } else {
        line.classList.remove('completed');
      }
    });
  }
  
  /**
   * 处理步骤完成
   */
  handleStepComplete(stepData) {
    // 合并数据
    Object.assign(this.data, stepData);
    
    console.log('✅ 步骤完成，数据:', stepData);
    console.log('📦 当前总数据:', this.data);
    
    // 是否是最后一步
    if (this.currentStepIndex === this.steps.length - 1) {
      // 完成激活流程
      this.complete();
    } else {
      // 进入下一步
      this.next();
    }
  }
  
  /**
   * 处理返回上一步
   */
  handleStepBack() {
    if (this.currentStepIndex > 0) {
      this.prev();
    }
  }
  
  /**
   * 下一步
   */
  next() {
    // 步骤切换动画
    this.stepContainer.style.animation = 'stepSlideOut 0.3s ease-in';
    
    setTimeout(() => {
      this.showStep(this.currentStepIndex + 1);
      this.stepContainer.style.animation = 'stepSlideIn 0.3s ease-out';
    }, 300);
  }
  
  /**
   * 上一步
   */
  prev() {
    this.stepContainer.style.animation = 'stepSlideOutReverse 0.3s ease-in';
    
    setTimeout(() => {
      this.showStep(this.currentStepIndex - 1);
      this.stepContainer.style.animation = 'stepSlideInReverse 0.3s ease-out';
    }, 300);
  }
  
  /**
   * 完成激活流程
   */
  async complete() {
    console.log('🎉 激活流程完成！');
    console.log('📦 最终数据:', this.data);
    
    try {
      // 保存激活数据到 LocalStorage
      const user = saveActivationData(this.data);
      
      console.log('✅ 激活数据已保存:', user);
      
      // 隐藏激活界面
      this.hide(() => {
        // 调用完成回调
        if (this.onComplete) {
          this.onComplete(user);
        }
      });
      
    } catch (error) {
      console.error('❌ 激活失败:', error);
      alert('激活失败，请重试');
    }
  }
  
  /**
   * 隐藏激活界面
   */
  hide(callback) {
    this.container.style.animation = 'authFadeOut 0.4s ease-in';
    
    setTimeout(() => {
      this.container.remove();
      if (callback) callback();
    }, 400);
  }
  
  /**
   * 销毁
   */
  destroy() {
    if (this.currentStep && this.currentStep.destroy) {
      this.currentStep.destroy();
    }
    if (this.container) {
      this.container.remove();
    }
  }
}

// 添加步骤切换动画到 CSS（动态注入）
if (!document.getElementById('activation-animations')) {
  const style = document.createElement('style');
  style.id = 'activation-animations';
  style.textContent = `
    @keyframes stepSlideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(-30px); opacity: 0; }
    }
    
    @keyframes stepSlideIn {
      from { transform: translateX(30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes stepSlideOutReverse {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(30px); opacity: 0; }
    }
    
    @keyframes stepSlideInReverse {
      from { transform: translateX(-30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}