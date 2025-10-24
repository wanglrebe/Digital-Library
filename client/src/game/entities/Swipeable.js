import Interactable from './Interactable.js';

/**
 * 可刷卡对象基类
 * 用于闸机、权限门等需要刷 ID 卡的对象
 */
export default class Swipeable extends Interactable {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture, config);
    
    // 权限配置
    this.requiredItem = config.requiredItem || 'id_card';  // 需要的物品
    this.requiredPermissions = config.requiredPermissions || [];  // 需要的权限列表
    this.allowEveryone = config.allowEveryone !== undefined ? config.allowEveryone : false;  // 是否允许所有人
    
    // 🆕 用于网络同步的唯一标识
    this.objectId = config.objectId || `swipeable_${x}_${y}`;
    
    console.log(`🔐 Swipeable 创建: ${this.objectId}, 允许所有人: ${this.allowEveryone}`);
  }
  
  /**
   * 检查玩家是否可以刷卡
   * @param {Player} player - 玩家对象
   * @returns {object} { allowed: boolean, reason?: string }
   */
  canPlayerSwipe(player) {
    // 1. 检查是否拥有 ID 卡
    if (!player.inventory.hasItem(this.requiredItem)) {
      return { 
        allowed: false, 
        reason: '需要 ID卡' 
      };
    }
    
    // 2. 如果允许所有人，直接通过
    if (this.allowEveryone) {
      return { allowed: true };
    }
    
    // 3. 检查权限
    const playerCard = player.inventory.getItem(this.requiredItem);
    
    if (!playerCard) {
      return { 
        allowed: false, 
        reason: '需要 Student ID Card' 
      };
    }
    
    // 检查是否拥有所有需要的权限
    const hasAllPermissions = this.requiredPermissions.every(
      perm => playerCard.permissions && playerCard.permissions.includes(perm)
    );
    
    if (!hasAllPermissions) {
      return { 
        allowed: false, 
        reason: '权限不足' 
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * 显示权限不足的提示
   * @param {string} reason - 原因
   */
  showAccessDeniedMessage(reason) {
    const msg = this.scene.add.text(this.x, this.y - 70, reason, {
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
      0xd95763,  // 红色边框（错误）
      0
    );
    msgBorder.setStrokeStyle(2, 0xd95763, 1);
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
   * 交互方法（重写 Interactable）
   * @param {Player} player - 玩家对象
   */
  interact(player) {
    const checkResult = this.canPlayerSwipe(player);
    
    if (!checkResult.allowed) {
      // 权限不足，显示提示
      this.showAccessDeniedMessage(checkResult.reason);
      console.log(`❌ 刷卡失败: ${checkResult.reason}`);
      return;
    }
    
    // 权限通过，调用子类的刷卡成功方法
    console.log(`✅ 刷卡成功: ${this.objectId}`);
    this.onSwipeSuccess(player);
  }
  
  /**
   * 刷卡成功后的行为（子类必须实现）
   * @param {Player} player - 玩家对象
   */
  onSwipeSuccess(player) {
    console.warn('Swipeable.onSwipeSuccess() 需要在子类中实现');
  }
}