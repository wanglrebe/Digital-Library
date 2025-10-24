import Phaser from 'phaser';

export default class Interactable extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture);
    
    this.scene = scene;
    this.promptText = config.promptText || '按 E 交互';
    this.canInteract = true;
    
    // 添加到场景
    scene.add.existing(this);
    
    // 创建提示文字（默认隐藏）
    // 找到创建提示文字的部分，替换为：

    // 🆕 创建像素风提示文字
    this.prompt = scene.add.text(x, y - 50, this.promptText, {
      fontSize: '10px',
      fontFamily: 'Press Start 2P, monospace',
      fill: '#f4e8d0',
      backgroundColor: 'rgba(26, 20, 16, 0.9)',
      padding: { x: 8, y: 6 },
      resolution: 2
    });
    this.prompt.setOrigin(0.5);
    this.prompt.setVisible(false);
    this.prompt.setDepth(1000);
    
    // 🆕 创建提示框边框
    this.promptBorder = scene.add.rectangle(
      x, y - 50,
      this.prompt.width + 4,
      this.prompt.height + 4,
      0x8b6f47,
      0
    );
    this.promptBorder.setStrokeStyle(2, 0x8b6f47, 1);
    this.promptBorder.setOrigin(0.5);
    this.promptBorder.setVisible(false);
    this.promptBorder.setDepth(999);
    
    // 注册到交互管理器
    if (scene.interactionManager) {
      scene.interactionManager.register(this);
    }
  }
  
  showPrompt() {
    if (this.canInteract) {
      this.prompt.setVisible(true);
      
      // 🆕 显示边框
      if (this.promptBorder) {
        this.promptBorder.setVisible(true);
      }
      
      // 🆕 淡入动画
      this.scene.tweens.add({
        targets: [this.prompt, this.promptBorder],
        alpha: { from: 0, to: 1 },
        y: { from: this.y - 45, to: this.y - 50 },
        duration: 200,
        ease: 'Cubic.easeOut'
      });
      
      // 轻微放大动画
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Back.easeOut'
      });
      
      // 添加淡黄色高亮
      this.setTint(0xffff99);
    }
  }
  
  hidePrompt() {
    // 🆕 淡出动画
    this.scene.tweens.add({
      targets: [this.prompt, this.promptBorder],
      alpha: 0,
      duration: 150,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.prompt.setVisible(false);
        if (this.promptBorder) {
          this.promptBorder.setVisible(false);
        }
      }
    });
    
    // 恢复原大小
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Back.easeIn'
    });
    
    // 移除高亮
    this.clearTint();
  }
  
  // 子类必须实现这个方法
  interact(player) {
    console.warn('Interactable.interact() 需要在子类中实现');
  }
  
  // 更新提示文字位置
  updatePromptPosition() {
    if (this.prompt) {
      this.prompt.setPosition(this.x, this.y - 50);
    }
    
    // 🆕 更新边框位置
    if (this.promptBorder) {
      this.promptBorder.setPosition(this.x, this.y - 50);
    }
  }
  
  destroy() {
    // 从交互管理器中移除
    if (this.scene.interactionManager) {
      this.scene.interactionManager.unregister(this);
    }
    
    if (this.prompt) {
      this.prompt.destroy();
    }
    
    // 🆕 销毁边框
    if (this.promptBorder) {
      this.promptBorder.destroy();
    }
    
    super.destroy();
  }
}