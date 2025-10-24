import Swipeable from './Swipeable.js';
import SocketManager from '../../network/SocketManager.js';

/**
 * 闸机类
 * 支持刷卡开启、自动关闭、玩家通过检测、多人同步
 */
export default class Gate extends Swipeable {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, 'gate', {
      promptText: '按 E 刷卡进入',
      requiredItem: 'id_card',
      allowEveryone: true,  // 闸机允许所有人
      objectId: config.gateId || `gate_${x}_${y}`,
      ...config
    });
    
    // 闸机配置
    this.gateId = config.gateId || `gate_${x}_${y}`;
    this.direction = config.direction || 'vertical';  // 'vertical' 或 'horizontal'
    
    // 状态机
    this.state = 'closed';  // 'closed' | 'opening' | 'opened' | 'closing'
    
    // 玩家通过检测
    this.wasPlayerOnFirstSide = null;  // 记录玩家之前在哪一侧
    
    // 设置初始帧（关闭状态）
    this.setFrame(0);
    this.setDepth(y);
    
    // 🆕 设置鼠标交互
    this.setupMouseInteraction();
    
    console.log(`🚪 闸机创建: ${this.gateId}, 方向: ${this.direction}`);
  }
  
  /**
   * 设置鼠标交互（参考 Seat.js）
   */
  setupMouseInteraction() {
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-32, -32, 64, 64),
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
    
    this.setTint(0xffff99);
    
    const player = this.scene.player;
    const distance = Phaser.Math.Distance.Between(
      player.x, player.y,
      this.x, this.y
    );
    
    if (distance < 60) {
      this.showPrompt();
    } else {
      this.showDistanceHint();
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
      this.interact(player);
    } else {
      this.showTooFarMessage();
    }
  }
  
  /**
   * 显示距离提示
   */
  showDistanceHint() {
    if (this.distanceHint) return;
    
    this.distanceHint = this.scene.add.text(this.x, this.y - 65, '点击刷卡', {
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
      this.x, this.y - 65,
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
    const msg = this.scene.add.text(this.x, this.y - 70, '太远了，走近一点', {
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
      this.x, this.y - 70,
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
      y: this.y - 75,
      duration: 200,
      ease: 'Cubic.easeOut'
    });
    
    this.scene.time.delayedCall(1500, () => {
      this.scene.tweens.add({
        targets: [msg, msgBorder],
        alpha: 0,
        y: this.y - 80,
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
   * 刷卡成功（重写 Swipeable）
   */
  onSwipeSuccess(player) {
    // 如果闸机正在动画中，忽略
    if (this.state === 'opening' || this.state === 'closing') {
      console.log('⏳ 闸机正在动画中，请稍候');
      return;
    }
    
    // 如果已经打开，忽略（避免重复刷卡）
    if (this.state === 'opened') {
      console.log('✅ 闸机已经打开');
      return;
    }
    
    // 播放刷卡音效（占位音：打印机音效）
    if (this.scene.soundManager) {
      this.scene.soundManager.playPositionalSound(
        'gate-beep',  // 🔧 临时占位音
        this.x, 
        this.y, 
        'effects'
      );
    }
    
    // 开始打开动画
    this.startOpening();
    
    // 🆕 发送网络事件（多人同步）
    SocketManager.emitGateInteract(this.gateId, 'open');
  }
  
  /**
   * 开始打开动画
   */
  startOpening() {
    console.log(`🚪 闸机开始打开: ${this.gateId}`);
    this.state = 'opening';
    
    // 播放打开动画
    this.play('gate-opening');
    
    // 动画结束后进入 opened 状态
    this.once('animationcomplete-gate-opening', () => {
      this.state = 'opened';
      this.wasPlayerOnFirstSide = null;  // 重置玩家位置记录
      console.log(`✅ 闸机已打开: ${this.gateId}`);
    });
  }
  
  /**
   * 开始关闭动画
   */
  startClosing() {
    console.log(`🚪 闸机开始关闭: ${this.gateId}`);
    this.state = 'closing';
    
    // 播放关闭动画
    this.play('gate-closing');
    
    // 动画结束后进入 closed 状态
    this.once('animationcomplete-gate-closing', () => {
      this.state = 'closed';
      console.log(`🔒 闸机已关闭: ${this.gateId}`);
    });
  }
  
  /**
   * 更新方法（每帧调用）
   * 检测玩家是否通过闸机
   */
  update() {
    // 只在 opened 状态检测
    if (this.state !== 'opened') return;
    
    const player = this.scene.player;
    
    // 根据闸机朝向选择检测方式
    let isPlayerOnFirstSide;
    if (this.direction === 'vertical') {
      // 南北方向：比较 Y 坐标
      isPlayerOnFirstSide = player.y < this.y;
    } else {
      // 东西方向：比较 X 坐标
      isPlayerOnFirstSide = player.x < this.x;
    }
    
    // 首次记录玩家位置
    if (this.wasPlayerOnFirstSide === null) {
      this.wasPlayerOnFirstSide = isPlayerOnFirstSide;
      return;
    }
    
    // 检测玩家是否"穿过"了闸机
    if (this.wasPlayerOnFirstSide !== isPlayerOnFirstSide) {
      console.log(`🚶 玩家通过闸机: ${this.gateId}`);
      this.startClosing();
      this.wasPlayerOnFirstSide = null;  // 重置
      
      // 🆕 发送网络事件
      SocketManager.emitGateInteract(this.gateId, 'close');
    }
  }
  
  /**
   * 🆕 处理其他玩家触发的闸机状态变化
   * @param {string} action - 'open' 或 'close'
   */
  handleRemoteStateChange(action) {
    if (action === 'open' && this.state === 'closed') {
      this.startOpening();
    } else if (action === 'close' && this.state === 'opened') {
      this.startClosing();
    }
  }
  
  /**
   * 销毁
   */
  destroy() {
    this.hideDistanceHint();
    super.destroy();
  }
}