/**
 * 物品栏系统
 * 管理玩家的物品（代币、纸张、ID卡等）
 */
export default class Inventory {
  constructor(initialItems = {}) {
    // 默认物品
    this.items = {
      id_card: 1,   // 🆕 ID卡（永久持有，不可丢弃）
      coin: 100,    // 代币（测试阶段给 100 个）
      paper: 0,     // 打印纸
      ...initialItems
    };
    
    // 物品元数据（图标、名称等）
    this.itemMeta = {
      id_card: { 
        icon: '🪪', 
        name: 'ID卡',
        canDiscard: false,  // 🆕 不可丢弃
        permissions: ['gate', 'level2', 'level3'],  // 🆕 权限列表
        accessLevel: 'student'  // 🆕 访问等级
      },
      coin: { 
        icon: '🪙', 
        name: '代币',
        canDiscard: true 
      },
      paper: { 
        icon: '📄', 
        name: '打印纸',
        canDiscard: true 
      }
    };
  }
  
  /**
   * 添加物品
   * @param {string} itemType - 物品类型
   * @param {number} amount - 数量
   * @returns {number} 添加后的总数
   */
  addItem(itemType, amount = 1) {
    if (!this.items.hasOwnProperty(itemType)) {
      this.items[itemType] = 0;
    }
    this.items[itemType] += amount;
    console.log(`📦 添加物品: ${itemType} +${amount}，当前: ${this.items[itemType]}`);
    return this.items[itemType];
  }
  
  /**
   * 移除物品
   * @param {string} itemType - 物品类型
   * @param {number} amount - 数量
   * @returns {boolean} 是否成功
   */
  removeItem(itemType, amount = 1) {
    if (!this.items.hasOwnProperty(itemType)) {
      console.warn(`⚠️ 物品不存在: ${itemType}`);
      return false;
    }
    if (this.items[itemType] < amount) {
      console.warn(`⚠️ 物品不足: ${itemType}，需要 ${amount}，拥有 ${this.items[itemType]}`);
      return false;
    }
    this.items[itemType] -= amount;
    console.log(`📦 移除物品: ${itemType} -${amount}，当前: ${this.items[itemType]}`);
    return true;
  }
  
  /**
   * 检查是否拥有足够的物品
   * @param {string} itemType - 物品类型
   * @param {number} amount - 数量
   * @returns {boolean}
   */
  hasItem(itemType, amount = 1) {
    return (this.items[itemType] || 0) >= amount;
  }
  
  /**
   * 🆕 获取物品对象（包含元数据）
   * @param {string} itemType - 物品类型
   * @returns {object|null}
   */
  getItem(itemType) {
    if (!this.items.hasOwnProperty(itemType)) {
      return null;
    }
    
    return {
      itemType: itemType,
      count: this.items[itemType],
      ...this.itemMeta[itemType]
    };
  }
  
  /**
   * 获取物品数量
   * @param {string} itemType - 物品类型
   * @returns {number}
   */
  getItemCount(itemType) {
    return this.items[itemType] || 0;
  }
  
  /**
   * 获取所有物品
   * @returns {object}
   */
  getAllItems() {
    return { ...this.items };
  }
  
  /**
   * 获取物品元数据
   * @param {string} itemType - 物品类型
   * @returns {object}
   */
  getItemMeta(itemType) {
    return this.itemMeta[itemType] || { 
      icon: '❓', 
      name: itemType,
      canDiscard: true 
    };
  }
}