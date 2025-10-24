import io from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.scene = null;
  }

  connect(scene, username) {
    this.scene = scene;
    
    // 动态获取服务器地址
    const serverUrl = `http://${window.location.hostname}:3000`;
    console.log('🔌 连接到服务器:', serverUrl);
    
    this.socket = io(serverUrl);
  
    this.socket.on('connect', () => {
      console.log('✅ 已连接到服务器:', this.socket.id);
      this.socket.emit('join', { username });
    });

    this.socket.on('current-players', (players) => {
      console.log('📥 接收到当前玩家列表:', players);
      players.forEach(playerData => {
        if (playerData.id !== this.socket.id) {
          scene.addOtherPlayer(playerData);
        }
      });
    });

    this.socket.on('player-joined', (playerData) => {
      console.log('👤 新玩家加入:', playerData.username);
      scene.addOtherPlayer(playerData);
    });

    this.socket.on('player-moved', (data) => {
      scene.updateOtherPlayer(data);
    });

    this.socket.on('player-left', (playerId) => {
      console.log('👋 玩家离开:', playerId);
      scene.removeOtherPlayer(playerId);
    });

    this.socket.on('player-sat', (data) => {
      console.log('🪑 玩家坐下:', data.playerId);
      scene.handleOtherPlayerSat(data);
    });

    this.socket.on('player-stood-up', (data) => {
      console.log('🚶 玩家站起:', data.playerId);
      scene.handleOtherPlayerStoodUp(data);
    });

    // 接收公共消息
    this.socket.on('chat-message', (data) => {
      console.log('💬 收到公共消息:', data);
      scene.handlePublicMessage(data);
    });

    // 接收私信
    this.socket.on('chat-private-message', (data) => {
      console.log('✉️ 收到私信:', data);
      scene.handlePrivateMessage(data);
    });

    // 🆕 接收其他玩家的打印机动画事件
    this.socket.on('printer-started', (data) => {
      console.log('🖨️ 收到打印机事件:', data.printerId);
      scene.handleOtherPlayerPrinter(data);
    });

    // 🆕 接收其他玩家的声音事件
    this.socket.on('other-player-sound', (data) => {
      if (scene.soundManager) {
        scene.soundManager.playPositionalSound(
          data.soundType,
          data.x,
          data.y,
          data.soundType === 'footstep' ? 'footsteps' : 'effects'
        );
      }
    });

    // 🆕 接收闸机状态变化
    this.socket.on('gate-state-changed', (data) => {
      console.log('🚪 收到闸机状态变化:', data.gateId, data.action);
      if (scene.handleGateStateChanged) {
        scene.handleGateStateChanged(data);
      }
    });
    
    // 🆕 接收其他玩家的勿扰状态变化
    this.socket.on('player-dnd-changed', (data) => {
      console.log('🔕 收到勿扰状态变化:', data.playerId, data.isDND);
      if (scene.dndManager) {
        scene.dndManager.handleRemoteChange(data.playerId, data.isDND);
      }
    });
  
    this.socket.on('disconnect', () => {
      console.log('❌ 与服务器断开连接');
    });
  }

  emitMove(x, y, animation) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player-move', { x, y, animation });
    }
  }

  emitSit(seatId, x, y, direction) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player-sit', { seatId, x, y, direction });
    }
  }

  emitStandUp() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player-stand-up');
      console.log('📤 发送站起事件');
    }
  }

  // 发送公共消息
  emitPublicMessage(message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat-public', { message });
      console.log('📤 发送公共消息:', message);
    }
  }

  // 发送私信
  emitPrivateMessage(targetPlayerId, message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat-private', { targetPlayerId, message });
      console.log('📤 发送私信给:', targetPlayerId, message);
    }
  }

  // 🆕 发送区域变化
  emitRegionChange(region) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player-region-change', {
        regionName: region.name,
        regionType: region.type
      });
      console.log('📍 发送区域变化:', region.name);
    }
  }

  // 🆕 发送声音事件
  emitSoundEvent(soundType, x, y) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player-sound-event', {
        soundType: soundType,
        x: x,
        y: y
      });
      // 不打印日志，避免刷屏
    }
  }

  // 🆕 发送闸机交互事件
  emitGateInteract(gateId, action) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('gate-interact', { 
        gateId: gateId, 
        action: action  // 'open' 或 'close'
      });
      console.log('📤 发送闸机事件:', gateId, action);
    }
  }
  
  // 🆕 发送勿扰状态变化
  emitDNDChange(isDND) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player-dnd-change', { 
        isDND: isDND
      });
      console.log('📤 发送勿扰状态:', isDND);
    }
  }

  emitPrinterStart(printerId) {
    console.log('🎯 [DEBUG] emitPrinterStart 被调用, printerId =', printerId);
    console.log('🎯 [DEBUG] socket 状态:', this.socket?.connected);
    
    if (this.socket && this.socket.connected) {
      this.socket.emit('printer-start', { printerId });
      console.log('📤 发送打印机事件:', printerId);
    } else {
      console.error('❌ Socket 未连接！');
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default new SocketManager();