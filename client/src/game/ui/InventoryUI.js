/**
 * 物品栏 UI 管理
 */
export default class InventoryUI {
  constructor(scene) {
    this.scene = scene;
    // ❌ 删除这行：this.player = scene.player;
    this.isOpen = false;
    
    this.panel = document.getElementById('inventory-panel');
    this.itemsContainer = document.getElementById('inventory-items');
    this.openBtn = document.getElementById('inventory-btn');
    this.closeBtn = document.getElementById('close-inventory-btn');
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // 打开/关闭物品栏
    this.openBtn.addEventListener('click', () => {
      this.toggle();
    });
    
    this.closeBtn.addEventListener('click', () => {
      this.close();
    });
  }
  
  /**
   * 切换物品栏显示
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  /**
   * 打开物品栏
   */
  open() {
    this.isOpen = true;
    this.panel.classList.remove('hidden');
    this.refresh();
  }
  
  /**
   * 关闭物品栏
   */
  close() {
    this.isOpen = false;
    this.panel.classList.add('hidden');
  }
  
  /**
   * 刷新物品显示
   */
  refresh() {
    // ✅ 每次都从 scene 获取 player
    const player = this.scene.player;
    
    if (!player || !player.inventory) {
      console.warn('⚠️ 玩家或物品栏不存在');
      return;
    }
    
    const inventory = player.inventory;
    const items = inventory.getAllItems();
    
    // 清空容器
    this.itemsContainer.innerHTML = '';
    
    // 获取所有物品类型
    const itemTypes = Object.keys(items);
    
    if (itemTypes.length === 0) {
      this.itemsContainer.innerHTML = '<div class="inventory-empty">物品栏是空的</div>';
      return;
    }
    
    // 渲染每个物品
    itemTypes.forEach(itemType => {
      const count = items[itemType];
      const meta = inventory.getItemMeta(itemType);
      
      const itemEl = document.createElement('div');
      itemEl.className = 'inventory-item';
      itemEl.innerHTML = `
        <div class="inventory-item-info">
          <span class="inventory-item-icon">${meta.icon}</span>
          <span class="inventory-item-name">${meta.name}</span>
        </div>
        <span class="inventory-item-count">×${count}</span>
      `;
      
      this.itemsContainer.appendChild(itemEl);
    });
    
    console.log('🔄 物品栏已刷新:', items); // ✅ 添加调试信息
  }
  
  /**
   * 更新物品数量（当物品变化时调用）
   */
  update() {
    if (this.isOpen) {
      this.refresh();
    }
  }
}