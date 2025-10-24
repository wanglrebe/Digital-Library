export default class InteractionManager {
  constructor(scene) {
    this.scene = scene;
    this.interactables = []; // 所有可交互物体
    this.nearestObject = null; // 当前最近的物体
    this.interactDistance = 60; // 交互距离（像素）
    
    this.setupInput();
  }
  
  setupInput() {
    // 监听 E 键
    this.interactKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );
    
    this.interactKey.on('down', () => {
      this.tryInteract();
    });
  }
  
  // 注册可交互物体
  register(interactable) {
    this.interactables.push(interactable);
  }
  
  // 取消注册
  unregister(interactable) {
    const index = this.interactables.indexOf(interactable);
    if (index > -1) {
      this.interactables.splice(index, 1);
    }
  }
  
  // 每帧更新（检测最近的物体）
  update(playerX, playerY) {
    let closest = null;
    let minDistance = this.interactDistance;
    
    // 找到最近的可交互物体
    this.interactables.forEach(obj => {
      if (!obj.canInteract) return;
      
      const distance = Phaser.Math.Distance.Between(
        playerX, playerY,
        obj.x, obj.y
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closest = obj;
      }
    });
    
    // 更新高亮状态
    if (this.nearestObject !== closest) {
      // 隐藏旧物体的提示
      if (this.nearestObject) {
        this.nearestObject.hidePrompt();
      }
      
      // 显示新物体的提示
      if (closest) {
        closest.showPrompt();
      }
      
      this.nearestObject = closest;
    }
  }
  
  // 尝试交互
  tryInteract() {
    if (this.nearestObject) {
      this.nearestObject.interact(this.scene.player);
    }
  }
  
  // 清理
  destroy() {
    this.interactKey.off('down');
    this.interactables = [];
    this.nearestObject = null;
  }
}