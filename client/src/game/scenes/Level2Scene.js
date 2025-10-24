import Phaser from 'phaser';
import Player from '../entities/Player';
import SocketManager from '../../network/SocketManager';
import InteractionManager from '../systems/InteractionManager.js';
import Seat from '../entities/Seat.js';
import NotificationManager from '../ui/NotificationManager.js';
import MessageCenter from '../ui/MessageCenter.js';
import InventoryUI from '../ui/InventoryUI.js'; // 🆕
import Printer from '../entities/Printer.js'; // 🆕
import SoundManager from '../systems/SoundManager.js'; // 🆕 导入 SoundManager
import SettingsPanel from '../ui/SettingsPanel.js'; // ← 检查这一行
import Gate from '../entities/Gate.js'; // 🆕 导入 Gate 类
import DoNotDisturbManager from '../systems/DoNotDisturbManager.js'; // 🆕

export default class Level2Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level2Scene' });
    this.otherPlayers = new Map();
    this.lastEmitTime = 0;
    this.emitInterval = 50;
    this.socketManager = SocketManager;
    this.isInputFocused = false;

    // 🆕 区域检测相关
    this.regions = [];                    // 所有区域数据
    this.currentRegion = null;            // 当前所在区域
    this.lastRegionCheckTime = 0;         // 上次检测时间
    this.regionCheckInterval = 100;       // 检测间隔 (100ms)

    this.printers = new Map(); // 🆕 存储所有打印机
    this.gates = new Map(); // 🆕 添加这一行 - 存储所有闸机
  }

  create() {
    console.log('Level2Scene: 场景创建');
  
    // 创建通知管理器
    this.notifications = new NotificationManager();
    
    // 创建消息中心
    this.messageCenter = new MessageCenter(this);

    // 🆕 创建物品栏 UI
    this.inventoryUI = new InventoryUI(this);

    // 🆕 创建声音管理器
    this.soundManager = new SoundManager(this);

    // 🆕 初始化本地脚步声池（在资源加载完成后）
    this.soundManager.initLocalFootstepPool();

    // 🆕 创建勿扰模式管理器
    this.dndManager = new DoNotDisturbManager(this);

    // 🆕 创建设置面板
    this.settingsPanel = new SettingsPanel(this);

    // 🆕 绑定勿扰按钮
    const dndButton = document.getElementById('dnd-button');
    if (dndButton) {
      dndButton.addEventListener('click', () => {
        this.dndManager.toggle();
        // 更新按钮状态
        if (this.dndManager.isEnabled) {
          dndButton.textContent = '🔕';
          dndButton.classList.add('active');
          
          // 更新屏幕效果
          const overlay = document.getElementById('dnd-overlay');
          if (overlay) overlay.classList.add('active');
        } else {
          dndButton.textContent = '🔔';
          dndButton.classList.remove('active');
          
          // 移除屏幕效果
          const overlay = document.getElementById('dnd-overlay');
          if (overlay) overlay.classList.remove('active');
        }
      });
      console.log('✅ 勿扰按钮已绑定');
    } else {
      console.warn('⚠️ 未找到勿扰按钮 (id="dnd-button")');
    }
    
    // 🆕 绑定设置按钮（假设 HTML 中有 id="settings-button"）
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        this.settingsPanel.toggle();
      });
      console.log('✅ 设置按钮已绑定');
    } else {
      console.warn('⚠️ 未找到设置按钮 (id="settings-button")');
    }
  
    // 加载 Tilemap
    this.map = this.make.tilemap({ key: 'level2-map' });
    
    // 添加 tilesets
    const tileset = this.map.addTilesetImage('library-tiles', 'library-tiles');
    const carpetTileset = this.map.addTilesetImage('carpet-gray-dark', 'carpet-gray-dark');
    const tableTileset = this.map.addTilesetImage('table-wood', 'table-wood');
    const wallPaperTileset = this.map.addTilesetImage('wall-paper-beige', 'wall-paper-beige');
    const receptionTileset = this.map.addTilesetImage('reception', 'reception'); // 🆕🆕🆕 新增

    // 🔧 关键修正：设置 reception tileset 的渲染偏移
    if (receptionTileset) {
      receptionTileset.tileOffset = { x: 0, y: 256 };
    }
    
    // 创建图层
    const floorLayer = this.map.createLayer('floor', [tileset, carpetTileset], 0, 0);
    const wallsLayer = this.map.createLayer('walls', [tileset, wallPaperTileset, receptionTileset], 0, 0); // 🆕 添加 receptionTileset
    const furnitureLayer = this.map.createLayer('furniture', [tileset, tableTileset, wallPaperTileset], 0, 0);


    wallsLayer.setCullPadding(10, 10);  // 水平和垂直方向各增加 10 个瓦片的缓冲

    
    // 设置碰撞
    if (wallsLayer) {
      wallsLayer.setCollisionByExclusion([-1]);
    }
    if (furnitureLayer) {
      furnitureLayer.setCollisionByExclusion([-1]);
    }
    
    // 获取地图尺寸
    const worldWidth = this.map.widthInPixels;
    const worldHeight = this.map.heightInPixels;
    
    console.log('地图大小:', worldWidth, 'x', worldHeight);

    // 🔧 设置固定出生点（与服务器一致）
    const SPAWN_POINT = {
      x: 1650,
      y: 1400
    };
  
    // 创建本地玩家
    const username = window.currentUsername || 'Guest' + Math.floor(Math.random() * 1000);
    console.log('👤 玩家用户名:', username);
    
    // 🔧 使用固定出生点
    this.player = new Player(this, SPAWN_POINT.x, SPAWN_POINT.y);
    this.player.username = username;
    this.player.nameText.setText(username);
  
    // 玩家碰撞
    if (wallsLayer) {
      this.physics.add.collider(this.player, wallsLayer);
    }
    if (furnitureLayer) {
      this.physics.add.collider(this.player, furnitureLayer);
    }
  
    // 设置相机跟随玩家
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  
    // 设置世界边界
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  
    // 设置相机边界
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
  
    // 连接到服务器
    SocketManager.connect(this, username);
  
    // 设置键盘控制
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
  
    // 创建交互管理器
    this.interactionManager = new InteractionManager(this);
    
    // 从 Tiled 加载座位
    this.loadSeatsFromTiled();

    // 🆕 创建闸机动画
    this.createGateAnimations();

    // 🆕 从 Tiled 加载打印机
    this.loadPrintersFromTiled();

    // 🆕 从 Tiled 加载闸机
    this.loadGatesFromTiled();

    // 🆕 从 Tiled 加载区域
    this.loadRegionsFromTiled();
  
    // 🆕 初始化环境音（等用户第一次交互后自动播放）
    this.input.keyboard.once('keydown', () => {
      this.startAmbientSound();
    });
    
    // H 键切换底部提示
    this.hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.hKey.on('down', () => {
      // 检查输入框是否获得焦点
      if (this.isInputFocused) return;
      
      const bottomHud = document.getElementById('hud-bottom');
      if (bottomHud) {
        bottomHud.classList.toggle('hidden');
      }
    });
    
    // 监听输入框焦点状态
    this.setupInputFocusListeners();

    // 🆕 添加快捷键监听
    this.setupHotkeys();
    
    // 显示欢迎消息
    this.messageCenter.addSystemAnnouncement(`欢迎来到 Digital Library - Level 2`);
    
    console.log('玩家创建完成，可以开始移动了！');

    // 🆕 监听勿扰模式网络事件
    this.socketManager.socket.on('player-dnd-changed', (data) => {
      console.log('🔕 收到勿扰状态变化:', data.playerId, data.isDND);
      if (this.dndManager) {
        this.dndManager.handleRemoteChange(data.playerId, data.isDND);
      }
    });

    // 🆕 测试物品栏功能
    console.log('📦 初始物品:', this.player.inventory.getAllItems());
    
  }

  /**
   * 🆕 启动环境音（用户第一次按键后调用）
   */
  startAmbientSound() {
    if (this.soundManager && this.currentRegion) {
      console.log('🎵 启动环境音系统');
      this.soundManager.updateAmbient(this.currentRegion.type);
    }
  }

  // 设置输入框焦点监听
  setupInputFocusListeners() {
    const messageInput = document.getElementById('message-input');
    
    if (messageInput) {
      // 获得焦点时
      messageInput.addEventListener('focus', () => {
        this.isInputFocused = true;
        console.log('🔒 输入框获得焦点，禁用游戏快捷键');
        
        // 禁用 Phaser 对这些按键的捕获
        this.input.keyboard.removeCapture('W,A,S,D,E,H,F,C,I'); // 🆕 添加 F,C,I
        this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.UP);
        this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.input.keyboard.removeCapture(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      });
      
      // 失去焦点时
      messageInput.addEventListener('blur', () => {
        this.isInputFocused = false;
        console.log('🔓 输入框失去焦点，启用游戏快捷键');
        
        // 重新启用 Phaser 对这些按键的捕获
        this.input.keyboard.addCapture('W,A,S,D,E,H,F,C,I'); // 🆕 添加 F,C,I
        this.input.keyboard.addCapture([
          Phaser.Input.Keyboard.KeyCodes.UP,
          Phaser.Input.Keyboard.KeyCodes.DOWN,
          Phaser.Input.Keyboard.KeyCodes.LEFT,
          Phaser.Input.Keyboard.KeyCodes.RIGHT
        ]);
      });
    }
  }

  // 添加其他玩家
  addOtherPlayer(playerData) {
    if (this.otherPlayers.has(playerData.id)) {
      return;
    }
  
    // ✅ 使用 playerData 中的坐标（已经是调整后的坐标）
    const otherPlayer = new Player(this, playerData.x, playerData.y);
    
    otherPlayer.username = playerData.username;
    otherPlayer.nameText.setText(playerData.username);
    
    otherPlayer.isSitting = false;
    otherPlayer.currentSeatId = null;
    
    if (playerData.isSitting) {
      otherPlayer.isSitting = true;
      otherPlayer.currentSeatId = playerData.seatId;
      
      otherPlayer.setPosition(playerData.x, playerData.y);
      
      const sittingFrame = Seat.getSittingFrame(playerData.seatDirection || 'down');
      otherPlayer.setFrame(sittingFrame);
      otherPlayer.anims.stop();
      
      if (playerData.seatDirection === 'up') {
        otherPlayer.setDepth(playerData.y - 10);
      } else {
        otherPlayer.setDepth(playerData.y + 10);
      }
      
      this.markSeatAsOccupied(playerData.seatId, otherPlayer, playerData.y, playerData.seatDirection);
    }
    
    this.otherPlayers.set(playerData.id, otherPlayer);
    
    this.updateOnlineCount();
  }

  // 更新其他玩家位置
  updateOtherPlayer(data) {
    const otherPlayer = this.otherPlayers.get(data.id);
    if (otherPlayer) {
      // ✅ 关键：如果玩家坐着，忽略移动事件
      if (otherPlayer.isSitting) {
        return;
      }
      
      
      this.tweens.add({
        targets: otherPlayer,
        x: data.x,
        y: data.y,
        duration: 50,
        ease: 'Linear'
      });
      
      if (data.animation) {
        otherPlayer.play(data.animation, true);
      }
    }
  }

  // 移除其他玩家
  removeOtherPlayer(playerId) {
    const otherPlayer = this.otherPlayers.get(playerId);
    if (otherPlayer) {
      otherPlayer.destroy();
      this.otherPlayers.delete(playerId);
      this.updateOnlineCount();
    }
  }

  // 更新在线人数显示
  updateOnlineCount() {
    const count = this.otherPlayers.size + 1;
    const onlineCountEl = document.getElementById('online-count');
    if (onlineCountEl) {
      onlineCountEl.textContent = `${count}`;
    }
  }

  // 从 Tiled 加载座位
  loadSeatsFromTiled() {
    const seatsLayer = this.map.getObjectLayer('seats');
    
    if (!seatsLayer) {
      console.warn('⚠️ 未找到 seats 对象层');
      return;
    }
    
    console.log(`找到 ${seatsLayer.objects.length} 个座位`);
    
    seatsLayer.objects.forEach((obj, index) => {
      const direction = obj.properties?.find(p => p.name === 'direction')?.value || 'down';
      
      // 🆕 根据自定义属性选择椅子类型和帧
      const chairType = obj.properties?.find(p => p.name === 'chairType')?.value || 'chair';
      
      let texture = 'chair';
      let frame = 0;
      
      // 🆕 如果是灰色椅子，使用 spritesheet 的不同帧
      if (chairType === 'chair-gray') {
        texture = 'chair-gray';
        frame = this.getChairFrame(direction);
      }
      
      const seat = new Seat(
        this,
        obj.x + 16,
        obj.y + 16,
        direction,
        texture,
        frame
      );
      
      seat.setData('id', obj.id || index);
      
      console.log(`创建座位 #${index}:`, obj.x, obj.y, '方向:', direction, '类型:', chairType);
    });
  }

  // 🆕 根据方向获取椅子帧号
  getChairFrame(direction) {
    const frameMap = {
      'up': 1,
      'left': 0,
      'down': 4,
      'right': 3
    };
    return frameMap[direction] || 2;
  }

  // 处理其他玩家坐下
  handleOtherPlayerSat(data) {
    const otherPlayer = this.otherPlayers.get(data.playerId);
    if (!otherPlayer) {
      console.warn('⚠️ 未找到玩家:', data.playerId);
      return;
    }
    
    // 关键修复：停止所有针对这个玩家的补间动画
    this.tweens.killTweensOf(otherPlayer);
    
    otherPlayer.isSitting = true;
    otherPlayer.currentSeatId = data.seatId;
    
    otherPlayer.setPosition(data.x, data.y);
    
    otherPlayer.anims.stop();
    const sittingFrame = Seat.getSittingFrame(data.direction);
    otherPlayer.setFrame(sittingFrame);
    
    if (data.direction === 'up') {
      otherPlayer.setDepth(data.y - 10);
    } else {
      otherPlayer.setDepth(data.y + 10);
    }
    
    this.markSeatAsOccupied(data.seatId, otherPlayer, data.y, data.direction);
  }

  // 处理其他玩家站起
  handleOtherPlayerStoodUp(data) {
    const otherPlayer = this.otherPlayers.get(data.playerId);
    if (!otherPlayer) {
      console.warn('⚠️ 未找到玩家:', data.playerId);
      return;
    }
    
    otherPlayer.isSitting = false;
    const oldSeatId = otherPlayer.currentSeatId;
    otherPlayer.currentSeatId = null;
    
    let standPosition = null;
    if (this.interactionManager) {
      this.interactionManager.interactables.forEach(obj => {
        if (obj.constructor.name === 'Seat' && obj.getData('id') === oldSeatId) {
          const offset = obj.getStandOffset(obj.direction);
          standPosition = {
            x: obj.x + offset.x,
            y: obj.y + offset.y
          };
        }
      });
    }
    
    if (standPosition) {
      otherPlayer.setPosition(standPosition.x, standPosition.y);
    }
    
    otherPlayer.play('idle-down', true);
    otherPlayer.setDepth(otherPlayer.y);
    
    this.releaseSeat(oldSeatId);
  }

  /**
   * 从 Tiled 加载打印机
   */
  loadPrintersFromTiled() {
    const interactablesLayer = this.map.getObjectLayer('interactables');
    
    if (!interactablesLayer) {
      console.warn('⚠️ 未找到 interactables 对象层');
      return;
    }
    
    let printerCount = 0;
    
    interactablesLayer.objects.forEach((obj) => {
      const type = obj.properties?.find(p => p.name === 'type')?.value;
      
      if (type === 'printer') {
        // 🆕 传入 obj.id 作为打印机ID
        const printer = new Printer(
          this,
          obj.x + 32,
          obj.y + 32,
          obj.id  // 🆕 使用 Tiled 对象的ID
        );
        
        // 🆕 保存打印机引用
        this.printers.set(obj.id, printer);
        
        printerCount++;
        console.log(`🖨️ 创建打印机 #${printerCount}: ID=${obj.id}, 位置=(${obj.x}, ${obj.y})`);
      }
    });
    
    console.log(`✅ 共加载 ${printerCount} 台打印机`);
  }

  // 🆕 添加处理其他玩家触发打印机的方法
  handleOtherPlayerPrinter(data) {
    console.log('🎯 [DEBUG] handleOtherPlayerPrinter 被调用, data =', data); // 🆕
    console.log('🎯 [DEBUG] 打印机列表:', this.printers); // 🆕
    
    const printer = this.printers.get(data.printerId);
    
    if (!printer) {
      console.warn('⚠️ 未找到打印机:', data.printerId);
      console.log('🎯 [DEBUG] 可用的打印机 IDs:', Array.from(this.printers.keys())); // 🆕
      return;
    }
    
    console.log(`🖨️ 其他玩家触发打印机: ID=${data.printerId}`);
    printer.playAnimation();
  }

  // 处理接收到的公共消息
  handlePublicMessage(data) {
    console.log('💬 收到公共消息:', data);
    
    this.messageCenter.addMessage({
      channel: 'area',
      type: data.senderId === this.socketManager.socket.id ? 'me' : 'other',
      sender: {
        id: data.senderId,
        username: data.senderName
      },
      content: data.message
    });
  }

  // 处理接收到的私信
  handlePrivateMessage(data) {
    console.log('✉️ 收到私信:', data);
    
    // 🔧 添加调试日志
    console.log('[DEBUG] 勿扰管理器存在:', !!this.dndManager);
    console.log('[DEBUG] 勿扰模式开启:', this.dndManager?.isEnabled);
    console.log('[DEBUG] 静音私信设置:', this.dndManager?.settings?.mutePrivateMsg);
    
    // 检查勿扰模式，决定是否显示浮动通知
    let showToast = true;
    
    if (this.dndManager && this.dndManager.isEnabled) {
      showToast = !this.dndManager.settings.mutePrivateMsg;
    }
    
    console.log('[DEBUG] 最终 showToast:', showToast);
    
    this.messageCenter.addPrivateMessage(data.senderId, {
      type: 'other',
      sender: {
        id: data.senderId,
        username: data.senderName
      },
      content: data.message
    }, showToast);
  }

  // 标记座位被占用
  markSeatAsOccupied(seatId, occupant, playerY = null, direction = null) {
    if (this.interactionManager) {
      this.interactionManager.interactables.forEach(obj => {
        if (obj.constructor.name === 'Seat' && obj.getData('id') === seatId) {
          obj.setOccupiedByOther(occupant);
          
          if (playerY !== null) {
            if (direction === 'up') {
              obj.setDepth(playerY + 10);
            } else {
              obj.setDepth(playerY - 10);
            }
          }
        }
      });
    }
  }

  // 释放座位
  releaseSeat(seatId) {
    if (this.interactionManager) {
      this.interactionManager.interactables.forEach(obj => {
        if (obj.constructor.name === 'Seat' && obj.getData('id') === seatId) {
          obj.releaseByOther();
          obj.setDepth(obj.y);
        }
      });
    }
  }

  // 【3】添加新方法：从 Tiled 加载区域
  /**
   * 从 Tiled 加载区域定义
   */
  loadRegionsFromTiled() {
    const regionsLayer = this.map.getObjectLayer('regions');
    
    if (!regionsLayer) {
      console.warn('⚠️ 未找到 regions 对象层，将使用默认区域');
      // 没有定义区域，整个地图都是公共区域
      this.currentRegion = {
        name: '公共区域',
        type: 'public'
      };
      this.updateRegionUI();
      return;
    }
    
    console.log(`📍 找到 ${regionsLayer.objects.length} 个区域`);
    
    // 加载所有区域
    regionsLayer.objects.forEach((obj) => {
      const name = obj.properties?.find(p => p.name === 'name')?.value || '未命名区域';
      const type = obj.properties?.find(p => p.name === 'type')?.value || 'public';
      
      const region = {
        name: name,
        type: type,
        bounds: {
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height
        }
      };
      
      this.regions.push(region);
      console.log(`  - ${name} (${type}): ${obj.x},${obj.y} - ${obj.width}×${obj.height}`);
    });
    
    console.log(`✅ 共加载 ${this.regions.length} 个区域`);
    
    // 初始检测当前区域
    this.checkCurrentRegion();
  }
  
  // ========================================
  // Level2Scene.js - 修改 checkCurrentRegion() 方法
  // ========================================
  
  /**
   * 检测玩家当前所在区域
   */
  checkCurrentRegion() {
    if (!this.player) return;
    
    const playerX = this.player.x;
    const playerY = this.player.y;
    
    // 遍历所有区域，找到玩家所在的区域
    let foundRegion = null;
    
    for (const region of this.regions) {
      const bounds = region.bounds;
      
      // 检查玩家是否在区域矩形内
      if (
        playerX >= bounds.x &&
        playerX <= bounds.x + bounds.width &&
        playerY >= bounds.y &&
        playerY <= bounds.y + bounds.height
      ) {
        foundRegion = region;
        break;
      }
    }
    
    // 如果没有找到任何区域，默认为公共区域
    if (!foundRegion) {
      foundRegion = {
        name: '公共区域',
        type: 'public'
      };
    }
    
    // 检查区域是否发生变化
    const regionChanged = 
      !this.currentRegion || 
      this.currentRegion.name !== foundRegion.name ||
      this.currentRegion.type !== foundRegion.type;
    
    if (regionChanged) {
      console.log(`📍 进入区域: ${foundRegion.name} (${foundRegion.type})`);
      this.currentRegion = foundRegion;
      
      // 1. 更新左上角 UI
      this.updateRegionUI();
      
      // 2. 通知服务器区域变化
      SocketManager.emitRegionChange(this.currentRegion);
      
      // 3. 通知消息中心更新频道名称
      if (this.messageCenter) {
        this.messageCenter.updateRegionName(this.currentRegion.name);
        this.messageCenter.updateUI();
      }
      
      // 🆕 4. 更新环境音
      if (this.soundManager) {
        this.soundManager.updateAmbient(this.currentRegion.type);
      }
    }
  }
  
  // 【5】添加新方法：更新区域 UI 显示
  /**
   * 更新左上角区域显示
   */
  updateRegionUI() {
    const regionNameEl = document.getElementById('region-name');
    if (regionNameEl && this.currentRegion) {
      regionNameEl.textContent = this.currentRegion.name;
    }
  }

  // ========================================
  // 🆕 闸机相关方法 - 添加到 Level2Scene.js
  // ========================================
  
  /**
   * 创建闸机动画
   */
  createGateAnimations() {
    // 开门动画（帧 0 → 1 → 2 → 3）
    this.anims.create({
      key: 'gate-opening',
      frames: this.anims.generateFrameNumbers('gate', { start: 0, end: 3 }),
      frameRate: 8,  // 8帧/秒 = 0.5秒完成
      repeat: 0      // 播放一次
    });
    
    // 关门动画（帧 3 → 2 → 1 → 0，倒放）
    this.anims.create({
      key: 'gate-closing',
      frames: this.anims.generateFrameNumbers('gate', { start: 3, end: 0 }),
      frameRate: 8,
      repeat: 0
    });
    
    console.log('🚪 闸机动画已创建');
  }
  
  /**
   * 从 Tiled 加载闸机
   */
  loadGatesFromTiled() {
    // 尝试从 'gates' 对象层加载
    let gatesLayer = this.map.getObjectLayer('gates');
    
    // 如果没有 gates 层，尝试从 interactables 层加载
    if (!gatesLayer) {
      console.log('⚠️ 未找到 gates 对象层，尝试从 interactables 加载');
      gatesLayer = this.map.getObjectLayer('interactables');
    }
    
    if (!gatesLayer) {
      console.warn('⚠️ 未找到 gates 或 interactables 对象层');
      return;
    }
    
    let gateCount = 0;
    
    gatesLayer.objects.forEach((obj) => {
      // 检查对象类型（可能是 'gate' 或在 type 属性中）
      const type = obj.type || obj.properties?.find(p => p.name === 'type')?.value;
      
      if (type === 'gate') {
        // 获取闸机朝向（默认 vertical）
        const direction = obj.properties?.find(p => p.name === 'direction')?.value || 'vertical';
        
        // 创建闸机（需要先导入 Gate 类）
        const gate = new Gate(
          this,
          obj.x + 32,  // Tiled 对象坐标是左上角，加 32 偏移到中心
          obj.y + 32,
          {
            gateId: obj.id || `gate_${gateCount}`,
            direction: direction
          }
        );
        
        // 保存闸机引用
        this.gates.set(gate.gateId, gate);
        
        gateCount++;
        console.log(`🚪 创建闸机 #${gateCount}: ID=${gate.gateId}, 位置=(${obj.x}, ${obj.y}), 方向=${direction}`);
      }
    });
    
    console.log(`✅ 共加载 ${gateCount} 个闸机`);
  }
  
  /**
   * 🆕 处理其他玩家触发的闸机状态变化
   */
  handleGateStateChanged(data) {
    console.log('🚪 收到闸机状态变化:', data.gateId, data.action);
    
    const gate = this.gates.get(data.gateId);
    
    if (!gate) {
      console.warn('⚠️ 未找到闸机:', data.gateId);
      console.log('🎯 可用的闸机 IDs:', Array.from(this.gates.keys()));
      return;
    }
    
    // 调用闸机的远程状态变化处理方法
    gate.handleRemoteStateChange(data.action);
  }

  // 【6】修改 update() 方法，添加定时区域检测
  update(time, delta) {
    // 如果输入框获得焦点，不处理游戏输入
    if (!this.isInputFocused) {
      this.player.move(this.cursors, this.wasd);
    }
    
    this.player.update();
    
    if (this.interactionManager) {
      this.interactionManager.update(this.player.x, this.player.y);
    }
    
    if (!this.player.isSitting) {
      this.player.setDepth(this.player.y);
    }
  
    // 只有在不坐着时才发送移动事件
    if (!this.player.isSitting && time - this.lastEmitTime > this.emitInterval) {
      SocketManager.emitMove(
        this.player.x,
        this.player.y,
        this.player.getCurrentAnimation()
      );
      this.lastEmitTime = time;
    }
  
    this.otherPlayers.forEach(otherPlayer => {
      otherPlayer.update();
      if (!otherPlayer.isSitting) {
        otherPlayer.setDepth(otherPlayer.y);
      }
    });
    
    // 🆕 定时检测区域变化 (每 100ms)
    if (time - this.lastRegionCheckTime > this.regionCheckInterval) {
      this.checkCurrentRegion();
      this.lastRegionCheckTime = time;
    }

    // 🆕 更新所有闸机（玩家通过检测）
    this.gates.forEach(gate => {
      gate.update();
    });

    // 🆕 更新勿扰模式管理器（图标位置）
    if (this.dndManager) {
      this.dndManager.update();
    }
  }

  /**
   * 🆕 设置快捷键
   */
  setupHotkeys() {
    // F 键 - 勿扰模式
    this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.fKey.on('down', () => {
      if (this.isInputFocused) return; // 输入框焦点时不触发
      
      if (this.dndManager) {
        this.dndManager.toggle();
        
        // 更新按钮状态
        const dndButton = document.getElementById('dnd-button');
        if (dndButton) {
          if (this.dndManager.isEnabled) {
            dndButton.textContent = '🔕';
            dndButton.classList.add('active');
            
            const overlay = document.getElementById('dnd-overlay');
            if (overlay) overlay.classList.add('active');
          } else {
            dndButton.textContent = '🔔';
            dndButton.classList.remove('active');
            
            const overlay = document.getElementById('dnd-overlay');
            if (overlay) overlay.classList.remove('active');
          }
        }
      }
    });
    
    // C 键 - 消息中心
    this.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.cKey.on('down', () => {
      if (this.isInputFocused) return;
      if (this.messageCenter) {
        this.messageCenter.toggle();
      }
    });
    
    // I 键 - 物品栏
    this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.iKey.on('down', () => {
      if (this.isInputFocused) return;
      if (this.inventoryUI) {
        this.inventoryUI.toggle();
      }
    });
    
    console.log('⌨️ 快捷键已设置: F(勿扰) C(消息) I(物品栏)');
  }
  
  shutdown() {
    if (this.interactionManager) {
      this.interactionManager.destroy();
    }
    
    // 清理声音管理器
    if (this.soundManager) {
      this.soundManager.destroy();
    }
    
    // 清理设置面板
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
    }
    
    // 🆕 清理勿扰模式管理器
    if (this.dndManager) {
      this.dndManager.destroy();
    }
    
    SocketManager.disconnect();
  }
}