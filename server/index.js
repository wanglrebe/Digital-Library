const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const players = new Map();
const gateStates = new Map(); // 🆕 存储闸机状态

io.on('connection', (socket) => {
  console.log('🟢 玩家连接:', socket.id);

  socket.on('join', (data) => {
    console.log('👤 玩家加入:', data.username, socket.id);
    
    players.set(socket.id, {
      id: socket.id,
      username: data.username || 'Guest',
      x: 512,
      y: 384,
      floor: 2,
      animation: 'idle-down',
      isSitting: false,
      seatId: null,
      seatDirection: null,
      currentRegion: '公共区域',
      isDND: false  // 🆕 添加勿扰状态字段
    });
  
    socket.emit('current-players', Array.from(players.values()));
    socket.broadcast.emit('player-joined', players.get(socket.id));
  });

  socket.on('player-move', (data) => {
    const player = players.get(socket.id);
    if (player) {
      if (!player.isSitting) {
        player.x = data.x;
        player.y = data.y;
        player.animation = data.animation;
        
        socket.broadcast.emit('player-moved', {
          id: socket.id,
          x: data.x,
          y: data.y,
          animation: data.animation
        });
      }
    }
  });

  socket.on('player-sit', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.isSitting = true;
      player.seatId = data.seatId;
      player.seatDirection = data.direction;
      player.x = data.x;
      player.y = data.y;
      
      socket.broadcast.emit('player-sat', {
        playerId: socket.id,
        seatId: data.seatId,
        x: data.x,
        y: data.y,
        direction: data.direction
      });
    }
  });

  socket.on('player-stand-up', () => {
    const player = players.get(socket.id);
    if (player) {
      console.log('🚶 玩家站起:', socket.id);
      
      const oldSeatId = player.seatId;
      player.isSitting = false;
      player.seatId = null;
      player.seatDirection = null;
      
      socket.broadcast.emit('player-stood-up', {
        playerId: socket.id,
        seatId: oldSeatId
      });
    }
  });

  // 处理区域变化
  socket.on('player-region-change', (data) => {
    const player = players.get(socket.id);
    if (player) {
      const oldRegion = player.currentRegion;
      player.currentRegion = data.regionName;
      
      console.log(`📍 玩家 ${player.username} 从 [${oldRegion}] 进入 [${data.regionName}]`);
    }
  });

  // 处理公共消息（区域隔离）
  socket.on('chat-public', (data) => {
    const sender = players.get(socket.id);
    if (!sender) return;
    
    const senderRegion = sender.currentRegion;
    console.log(`💬 [${senderRegion}] ${sender.username}: ${data.message}`);
    
    // 只广播给同区域的玩家
    for (const [playerId, player] of players.entries()) {
      // 跳过发送者自己（发送者在前端已经显示了自己的消息）
      if (playerId === socket.id) continue;
      
      // 只发送给同区域的玩家
      if (player.currentRegion === senderRegion) {
        io.to(playerId).emit('chat-message', {
          senderId: socket.id,
          senderName: sender.username,
          message: data.message,
          timestamp: Date.now()
        });
      }
    }
  });

  // 处理私信（保持不变）
  socket.on('chat-private', (data) => {
    const player = players.get(socket.id);
    const targetPlayer = players.get(data.targetPlayerId);
    
    if (player && targetPlayer) {
      console.log('✉️ 私信:', player.username, '→', targetPlayer.username, ':', data.message);
      
      io.to(data.targetPlayerId).emit('chat-private-message', {
        senderId: socket.id,
        senderName: player.username,
        message: data.message,
        timestamp: Date.now()
      });
    } else {
      console.warn('⚠️ 私信发送失败: 目标玩家不存在', data.targetPlayerId);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 玩家断开:', socket.id);
    
    const player = players.get(socket.id);
    if (player && player.isSitting) {
      io.emit('player-stood-up', {
        playerId: socket.id,
        seatId: player.seatId
      });
    }
    
    players.delete(socket.id);
    io.emit('player-left', socket.id);
  });

  // 处理声音事件
  socket.on('player-sound-event', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    // 广播给所有其他玩家
    socket.broadcast.emit('other-player-sound', {
      playerId: socket.id,
      soundType: data.soundType,
      x: data.x,
      y: data.y
    });
    
    // 不打印日志，避免刷屏（脚步声太频繁）
  });

  // 处理打印机启动事件
  socket.on('printer-start', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    console.log(`🖨️ 玩家 ${player.username} 使用打印机 ID=${data.printerId}`);
    
    // 广播给所有其他玩家
    socket.broadcast.emit('printer-started', {
      printerId: data.printerId,
      playerId: socket.id
    });
  });

  // 🆕 处理闸机交互事件
  socket.on('gate-interact', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    const { gateId, action } = data;  // action: 'open' 或 'close'
    
    console.log(`🚪 玩家 ${player.username} ${action === 'open' ? '打开' : '关闭'}闸机 ID=${gateId}`);
    
    // 更新闸机状态
    if (action === 'open') {
      gateStates.set(gateId, { state: 'opened', timestamp: Date.now() });
    } else if (action === 'close') {
      gateStates.set(gateId, { state: 'closed', timestamp: Date.now() });
    }
    
    // 广播给所有其他玩家
    socket.broadcast.emit('gate-state-changed', {
      gateId: gateId,
      action: action,
      playerId: socket.id
    });
  });
  
  // 🆕 处理勿扰模式状态变化
  socket.on('player-dnd-change', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    player.isDND = data.isDND;
    
    console.log(`🔕 玩家 ${player.username} ${data.isDND ? '开启' : '关闭'}勿扰模式`);
    
    // 广播给所有其他玩家
    socket.broadcast.emit('player-dnd-changed', {
      playerId: socket.id,
      isDND: data.isDND
    });
  });
});

const PORT = 3000;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`📡 局域网访问: http://${getLocalIP()}:${PORT}`);
  console.log(`📊 当前在线人数: 0`);
});

function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

setInterval(() => {
  console.log(`📊 当前在线人数: ${players.size}`);
}, 10000);