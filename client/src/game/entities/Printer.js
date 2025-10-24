import Interactable from './Interactable.js';
import SocketManager from '../../network/SocketManager.js'; // 🆕 添加这一行


/**
 * 打印机类
 * 消耗代币，产生打印纸
 */
export default class Printer extends Interactable {
  constructor(scene, x, y, id) { // ← 添加 id 参数
    super(scene, x, y, 'printer', {
      promptText: '按 E 打印 (1 🪙)'
    });
    
    this.scene = scene;
    this.printerId = id; // ← 保存打印机ID
    this.isAnimating = false;
    
    // 设置初始帧（静止状态）
    this.setFrame(0);
    
    // 创建打印动画（如果还没有）
    this.createPrintAnimation();
    
    // 设置鼠标交互
    this.setupMouseInteraction();
    
    console.log(`🖨️ 打印机创建: ID=${this.printerId}`); // ← 调试日志
  }
  
  /**
   * 创建打印动画
   */
  createPrintAnimation() {
    const animsManager = this.scene.anims;
    
    // 如果动画已存在，不重复创建
    if (animsManager.exists('printer-print')) {
      return;
    }
    
    // 创建打印动画（帧 1-10，帧 0 是静止状态）
    animsManager.create({
      key: 'printer-print',
      frames: animsManager.generateFrameNumbers('printer', { 
        start: 1,
        end: 10
      }),
      frameRate: 12,
      repeat: 0
    });
    
    console.log('🖨️ 打印机动画已创建');
  }
  
  /**
   * 设置鼠标交互
   */
  setupMouseInteraction() {
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-16, -16, 96, 96), // 打印机是 64×64，稍微放大交互区域
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true
    });
    
    this.on('pointerover', () => {
      this.onMouseOver();
    });
    
    this.on('pointerout', () => {
      this.onMouseOut();
    });
    
    this.on('pointerdown', (pointer) => {
      this.onMouseClick(pointer);
    });
  }
  
  /**
   * 鼠标悬停
   */
  onMouseOver() {
    if (!this.canInteract) return;
    
    this.setTint(0xffff99); // 高亮
    
    const player = this.scene.player;
    const distance = Phaser.Math.Distance.Between(
      player.x, player.y,
      this.x, this.y
    );
    
    if (distance < 60) {
      this.showPrompt(); // 显示 "按 E 打印 (1 🪙)"
    } else {
      this.showDistanceHint(); // 显示 "点击打印"
    }
  }
  
  /**
   * 鼠标移出
   */
  onMouseOut() {
    this.clearTint();
    this.hidePrompt();
    this.hideDistanceHint();
  }
  
  /**
   * 鼠标点击
   */
  onMouseClick(pointer) {
    const player = this.scene.player;
    
    const distance = Phaser.Math.Distance.Between(
      player.x, player.y,
      this.x, this.y
    );
    
    if (distance < 60) {
      this.interact(player); // 距离足够，触发交互
    } else {
      this.showTooFarMessage(); // 距离不够，显示提示
    }
  }
  
  /**
   * 显示距离提示（远距离时）
   */
  showDistanceHint() {
    if (this.distanceHint) return;
    
    this.distanceHint = this.scene.add.text(this.x, this.y - 80, '点击打印', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P, monospace',
      fill: '#f4e8d0',
      backgroundColor: 'rgba(26, 20, 16, 0.9)',
      padding: { x: 8, y: 6 },
      resolution: 2
    });
    this.distanceHint.setOrigin(0.5);
    this.distanceHint.setDepth(1001);
    
    this.distanceHintBorder = this.scene.add.rectangle(
      this.x, this.y - 80,
      this.distanceHint.width + 4,
      this.distanceHint.height + 4,
      0x8b6f47,
      0
    );
    this.distanceHintBorder.setStrokeStyle(2, 0x8b6f47, 1);
    this.distanceHintBorder.setOrigin(0.5);
    this.distanceHintBorder.setDepth(1000);
  }
  
  /**
   * 隐藏距离提示
   */
  hideDistanceHint() {
    if (this.distanceHint) {
      this.distanceHint.destroy();
      this.distanceHint = null;
    }
    if (this.distanceHintBorder) {
      this.distanceHintBorder.destroy();
      this.distanceHintBorder = null;
    }
  }
  
  /**
   * 显示"太远了"消息
   */
  showTooFarMessage() {
    const msg = this.scene.add.text(this.x, this.y - 85, '太远了，走近一点', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P, monospace',
      fill: '#f4e8d0',
      backgroundColor: 'rgba(26, 20, 16, 0.9)',
      padding: { x: 8, y: 6 },
      resolution: 2
    });
    msg.setOrigin(0.5);
    msg.setDepth(1001);
    
    const msgBorder = this.scene.add.rectangle(
      this.x, this.y - 85,
      msg.width + 4,
      msg.height + 4,
      0xff6c11,
      0
    );
    msgBorder.setStrokeStyle(2, 0xff6c11, 1);
    msgBorder.setOrigin(0.5);
    msgBorder.setDepth(1000);
    
    msg.setAlpha(0);
    msgBorder.setAlpha(0);
    
    this.scene.tweens.add({
      targets: [msg, msgBorder],
      alpha: 1,
      y: this.y - 90,
      duration: 200,
      ease: 'Cubic.easeOut'
    });
    
    this.scene.time.delayedCall(1500, () => {
      this.scene.tweens.add({
        targets: [msg, msgBorder],
        alpha: 0,
        y: this.y - 95,
        duration: 200,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          msg.destroy();
          msgBorder.destroy();
        }
      });
    });
  }
  
  /**
   * 交互方法（按 E 键或鼠标点击触发）
   */
  interact(player) {
    console.log('🎯 [DEBUG] interact() 被调用, printerId =', this.printerId); // 🆕
    
    if (this.isAnimating) {
      this.scene.notifications.warning('打印机正在工作...', 2000);
      return;
    }
    
    const inventory = player.inventory;
    
    if (!inventory.hasItem('coin', 1)) {
      this.scene.notifications.error('代币不足，无法打印', 2500);
      player.showFloatingText('代币不足!', '#d95763');
      return;
    }
    
    inventory.removeItem('coin', 1);
    player.showFloatingText('-1 🪙', '#ff6c11');
    
    console.log('🎯 [DEBUG] 准备发送网络事件, printerId =', this.printerId); // 🆕
    SocketManager.emitPrinterStart(this.printerId);
    
    this.startPrinting(player);
  }
  
  /**
   * 开始打印
   */
  startPrinting(player) {
    this.isAnimating = true;
    this.canInteract = false; // 禁用交互
    this.hidePrompt(); // 隐藏提示
    this.hideDistanceHint(); // 隐藏距离提示
    
    // 🆕 播放打印音效（单一完整音效）
    if (this.scene.soundManager) {
      this.scene.soundManager.playLocalPrinter('complete', this.x, this.y);
    }
    
    // 🆕 发送声音事件到其他玩家
    if (typeof SocketManager !== 'undefined') {
      SocketManager.emitSoundEvent('printer-complete', this.x, this.y);
    }
    
    // 播放打印动画
    this.play('printer-print');
    
    console.log('🖨️ 开始打印...');
    
    // 监听动画完成
    this.once('animationcomplete', () => {
      this.onPrintComplete(player);
    });
  }

  /**
   * 🆕 播放打印动画（可被其他玩家调用）
   * 这个方法只负责播放动画，不处理物品和声音
   */
  playAnimation() {
    if (this.isAnimating) {
      console.log('⚠️ 打印机已在运行，忽略重复请求');
      return;
    }
    
    this.isAnimating = true;
    this.canInteract = false;
    this.hidePrompt();
    this.hideDistanceHint();
    
    console.log(`🖨️ 播放打印动画: ID=${this.printerId}`);
    this.play('printer-print');
    
    // 动画结束后恢复状态（但不给物品）
    this.once('animationcomplete', () => {
      this.resetAfterAnimation();
    });
  }
  
  /**
   * 🆕 动画结束后重置状态（其他玩家用）
   */
  resetAfterAnimation() {
    console.log(`✅ 打印动画完成: ID=${this.printerId}`);
    this.setFrame(0);
    this.isAnimating = false;
    this.canInteract = true;
  }
  
  /**
   * 打印完成
   */
  onPrintComplete(player) {
    console.log('✅ 打印完成！');
    
    // 恢复静止帧
    this.setFrame(0);
    this.isAnimating = false;
    this.canInteract = true;
    
    // ❌ 不再播放声音（已经在 startPrinting 播放过了）
    
    // 添加打印纸到物品栏
    player.inventory.addItem('paper', 1);
    player.showFloatingText('+1 📄', '#6abe30');
    
    // 显示通知
    this.scene.notifications.success('打印完成！获得打印纸 ×1', 2500);
    
    // 更新物品栏 UI
    if (this.scene.inventoryUI) {
      this.scene.inventoryUI.update();
    }
  }
  
  /**
   * 销毁
   */
  destroy() {
    // 清理鼠标交互相关的内容
    this.hideDistanceHint();
    
    // 清理事件监听
    this.off('animationcomplete');
    this.off('pointerover');
    this.off('pointerout');
    this.off('pointerdown');
    
    super.destroy();
  }
}