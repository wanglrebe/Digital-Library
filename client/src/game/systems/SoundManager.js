/**
 * SoundManager - 统一声音管理系统
 * 
 * 功能：
 * 1. 底噪（环境音）- 区域特定的循环背景音
 * 2. 位置音 - 所有带位置的声音（脚步、椅子、打印机等）
 * 3. 音量控制 - 分类音量管理
 * 
 * 核心设计：
 * - 除了底噪，所有声音都考虑空间位置
 * - 使用平方衰减算法模拟真实声音传播
 * - 本地玩家脚步声使用音频池（可立即停止）
 * - 其他玩家脚步声使用独立实例（互不干扰）
 */
export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
    
    // 声音对象存储
    this.sounds = new Map();
    this.currentAmbient = null;
    
    // 🆕 本地脚步声池
    this.localFootstepPool = [];
    this.localFootstepPoolSize = 6;
    this.localFootstepPoolIndex = 0;
    
    // 音量配置（默认值）
    this.volumes = {
      master: 1.0,
      ambient: 0.3,
      effects: 0.8,
      footsteps: 0.5
    };
    
    // 🆕 从 LocalStorage 加载音量设置（覆盖默认值）
    this.loadVolumesFromLocalStorage();
    
    // 声音配置 - 不同声音类型的距离和衰减参数
    this.soundConfig = {
      footstep: {
        maxDistance: 200,     // 最大听力范围（像素）
        falloffPower: 2,      // 衰减指数（2 = 平方衰减）
        minVolume: 0.1        // 最小音量阈值
      },
      chair: {
        maxDistance: 150,
        falloffPower: 2,
        minVolume: 0.05
      },
      printer: {
        maxDistance: 250,
        falloffPower: 1.8,    // 机械声传得稍远
        minVolume: 0.08
      },
      // 🆕 添加闸机配置
      gate: {
        maxDistance: 180,      // 闸机声音传播范围
        falloffPower: 2,       // 平方衰减
        minVolume: 0.1
      }
    };
    
    // 脚步声节流（避免频繁发送）
    this.lastFootstepTime = 0;
    this.footstepInterval = 500; // 每 500ms 最多发送一次脚步声事件
    
    // 环境音配置
    this.ambientConfig = {
      'study': {
        key: 'ambient-study',
        volume: 0.25,
        fadeIn: 1000
      },
      'discussion': {
        key: 'ambient-discussion',
        volume: 0.4,
        fadeIn: 1000
      },
      'leisure': {
        key: 'ambient-leisure',
        volume: 0.5,
        fadeIn: 1000
      },
      'public': {
        key: 'ambient-public',
        volume: 0.3,
        fadeIn: 1000
      }
    };
    
    console.log('🎵 SoundManager 已初始化');
  }
  
  // ========================================
  // 🆕 初始化本地脚步声池
  // ========================================
  
  /**
   * 初始化本地脚步声池（在 Level2Scene.create() 中调用）
   * 为每个脚步声变体创建实例
   */
  initLocalFootstepPool() {
    // 清空旧池
    this.localFootstepPool.forEach(sound => sound.destroy());
    this.localFootstepPool = [];
    
    // 🆕 为每个变体创建实例
    const variants = ['footstep-01', 'footstep-02', 'footstep-03', 'footstep-04'];
    
    // 每个变体创建 1-2 个实例
    variants.forEach(key => {
      const sound = this.scene.sound.add(key, {
        volume: 0
      });
      this.localFootstepPool.push(sound);
    });
    
    // 可选：再创建几个额外的实例（如果需要更快的重复播放）
    for (let i = 0; i < 2; i++) {
      const randomKey = Phaser.Utils.Array.GetRandom(variants);
      const sound = this.scene.sound.add(randomKey, {
        volume: 0
      });
      this.localFootstepPool.push(sound);
    }
    
    this.localFootstepPoolSize = this.localFootstepPool.length;
    
    console.log(`👣 本地脚步声池已创建 (${this.localFootstepPoolSize} 个实例，${variants.length} 个变体)`);
  }
  
  // ========================================
  // 底噪（环境音）管理
  // ========================================
  
  /**
   * 播放环境音（循环）
   * 使用交叉淡入淡出（Crossfade）技术，确保音量平滑过渡
   * 
   * @param {string} regionType - 区域类型（study/discussion/leisure/public）
   */
  playAmbient(regionType) {
    const config = this.ambientConfig[regionType];
    
    if (!config) {
      console.warn(`⚠️ 未找到区域类型 "${regionType}" 的环境音配置`);
      return;
    }
    
    // 如果当前正在播放相同的环境音，不重复播放
    if (this.currentAmbient && this.currentAmbient.key === config.key) {
      console.log(`🎵 环境音 "${config.key}" 已在播放`);
      return;
    }
    
    // 交叉淡入淡出时长（统一为 500ms）
    const crossfadeDuration = 500;
    
    // 停止当前环境音（带淡出）
    if (this.currentAmbient) {
      this.stopAmbient(crossfadeDuration);
    }
    
    // 立即创建并播放新环境音
    console.log(`🎵 开始播放环境音: ${config.key} (区域: ${regionType})`);
    
    this.currentAmbient = this.scene.sound.add(config.key, {
      loop: true,
      volume: 0 // 从 0 开始，淡入
    });
    
    // 立即播放
    this.currentAmbient.play();
    
    // 🔧 计算目标音量（考虑勿扰模式）
    let targetVolume = config.volume * this.volumes.ambient * this.volumes.master;
    
    // 🔧 如果勿扰模式开启，音量减半
    if (this.scene.dndManager && this.scene.dndManager.isEnabled && this.scene.dndManager.settings.lowerAmbient) {
      targetVolume = targetVolume * 0.5;
      console.log(`🔕 勿扰模式：环境音减半 (${targetVolume.toFixed(3)})`);
    }
    
    // 淡入效果（时长与淡出相同）
    this.scene.tweens.add({
      targets: this.currentAmbient,
      volume: targetVolume,
      duration: crossfadeDuration,
      ease: 'Linear'
    });
  }
  
  /**
   * 停止环境音
   * @param {number} fadeOutDuration - 淡出时长（毫秒）
   */
  stopAmbient(fadeOutDuration = 500) {
    if (!this.currentAmbient) return;
    
    console.log(`🔇 停止环境音: ${this.currentAmbient.key}`);
    
    const ambient = this.currentAmbient;
    this.currentAmbient = null;
    
    // 🆕 CRITICAL: 先杀死所有针对这个声音的 tween（避免竞态条件）
    this.scene.tweens.killTweensOf(ambient);
    
    // 淡出后停止
    this.scene.tweens.add({
      targets: ambient,
      volume: 0,
      duration: fadeOutDuration,
      ease: 'Linear',
      onComplete: () => {
        // 🆕 再次检查：在 tween 完成前，对象可能已经被销毁
        if (ambient && !ambient.pendingRemove) {
          ambient.stop();
          ambient.destroy();
        }
      }
    });
  }
  
  /**
   * 更新环境音（根据区域变化）
   * @param {string} regionType - 新区域类型
   */
  updateAmbient(regionType) {
    this.playAmbient(regionType);
  }
  
  // ========================================
  // 位置音管理（所有带位置的声音）
  // ========================================
  
  /**
   * 播放位置音（其他玩家的声音）
   * 
   * 注意：这个方法用于远程声音，每次创建新实例
   * 本地玩家的脚步声使用 playLocalFootstep()
   * 
   * @param {string} soundType - 声音类型（footstep / chair-sit / chair-standup / printer-start / printer-complete）
   * @param {number} sourceX - 声源 X 坐标
   * @param {number} sourceY - 声源 Y 坐标
   * @param {string} category - 音量类别（'footsteps' / 'effects'）
   */
  playPositionalSound(soundType, sourceX, sourceY, category = 'effects') {
    // 🆕 勿扰模式检查：如果勿扰模式开启且设置中静音他人声音，则不播放
    if (this.scene.dndManager && this.scene.dndManager.isEnabled) {
      if (!this.scene.dndManager.shouldPlayRemoteSound(soundType)) {
        return; // 静音，不播放
      }
    }
    
    // 获取本地玩家位置
    const player = this.scene.player;
    if (!player) {
      console.warn('⚠️ 未找到本地玩家，无法播放位置音');
      return;
    }
    
    // 计算距离
    const distance = Phaser.Math.Distance.Between(
      player.x, player.y,
      sourceX, sourceY
    );
    
    // 获取声音类型的基础名称（移除 -sit/-standup/-start 等后缀）
    const baseType = soundType.split('-')[0]; // 'chair-sit' → 'chair'
    
    // 获取声音配置
    const config = this.soundConfig[baseType];
    
    if (!config) {
      console.warn(`⚠️ 未找到声音类型 "${baseType}" 的配置，使用默认配置`);
      // 使用默认配置
      const defaultConfig = {
        maxDistance: 200,
        falloffPower: 2,
        minVolume: 0.05
      };
      
      const distanceVolume = this.getVolumeByDistance(
        distance,
        defaultConfig.maxDistance,
        defaultConfig.falloffPower,
        defaultConfig.minVolume
      );
      
      if (distanceVolume === 0) return;
      
      const categoryVolume = this.volumes[category] || 1.0;
      const finalVolume = distanceVolume * categoryVolume * this.volumes.master;
      
      this.playSound(soundType, finalVolume);
      
      console.log(`📍 播放位置音: ${soundType}, 距离: ${distance.toFixed(0)}px, 音量: ${finalVolume.toFixed(2)}`);
      return;
    }
    
    // 计算音量
    const distanceVolume = this.getVolumeByDistance(
      distance,
      config.maxDistance,
      config.falloffPower,
      config.minVolume
    );
    
    // 如果音量为 0，不播放
    if (distanceVolume === 0) {
      return;
    }
    
    // 应用分类音量
    const categoryVolume = this.volumes[category] || 1.0;
    const finalVolume = distanceVolume * categoryVolume * this.volumes.master;
    
    // 播放声音（远程声音用独立实例）
    this.playSound(soundType, finalVolume);
    
    console.log(`📍 播放位置音: ${soundType}, 距离: ${distance.toFixed(0)}px, 音量: ${finalVolume.toFixed(2)}`);
  }
  
  /**
   * 内部方法：播放声音（用于远程声音）
   * 每次创建新实例，播放完自动销毁
   * 
   * @param {string} soundType - 声音类型
   * @param {number} volume - 音量
   */
  playSound(soundType, volume) {
    const soundKey = this.getSoundKey(soundType);
    
    // 创建新实例（不使用池）
    const sound = this.scene.sound.add(soundKey, {
      volume: volume
    });
    
    // 播放完自动销毁
    sound.once('complete', () => {
      sound.destroy();
    });
    
    sound.play();
  }
  
  /**
   * 基于距离计算音量（平方衰减）
   * @param {number} distance - 当前距离
   * @param {number} maxDistance - 最大听力范围
   * @param {number} falloffPower - 衰减指数（默认 2，即平方衰减）
   * @param {number} minVolume - 最小音量阈值（默认 0.05）
   * @returns {number} 音量 (0-1)
   */
  getVolumeByDistance(distance, maxDistance, falloffPower = 2, minVolume = 0.05) {
    // 超出最大距离，直接返回 0
    if (distance >= maxDistance) {
      return 0;
    }
    
    // 计算距离比例
    const ratio = distance / maxDistance;
    
    // 平方衰减：volume = 1 - ratio^falloffPower
    const volume = 1 - Math.pow(ratio, falloffPower);
    
    // 低于最小音量阈值时返回 0（避免"蚊子嗡嗡"）
    return volume < minVolume ? 0 : volume;
  }
  
  /**
   * 获取声音文件的 key
   * @param {string} soundType - 声音类型
   * @returns {string} Phaser 音频 key
   */
  getSoundKey(soundType) {
    // 🆕 脚步声随机选择（4 个变体）
    if (soundType === 'footstep') {
      const index = Phaser.Math.Between(1, 4);
      return `footstep-0${index}`;
    }
    
    // 其他声音直接映射
    // 'chair-sit' → 'chair-sit'
    // 'printer-complete' → 'printer-complete'
    return soundType;
  }
  
  // ========================================
  // 本地玩家声音（使用音频池，可立即停止）
  // ========================================
  
  /**
   * 播放本地脚步声（自己走路）
   * 使用音频池，可以立即停止
   * 声源位置 = 玩家位置 → 距离 0 → 满音量
   * 
   * @returns {boolean} 是否播放成功
   */
  playLocalFootstep() {
    const now = Date.now();
    
    // 节流检查
    if (now - this.lastFootstepTime < this.footstepInterval) {
      return false;
    }
    
    this.lastFootstepTime = now;
    
    // 🆕 从池中获取下一个声音（循环使用）
    const sound = this.localFootstepPool[this.localFootstepPoolIndex];
    this.localFootstepPoolIndex = (this.localFootstepPoolIndex + 1) % this.localFootstepPoolSize;
    
    // 🆕 如果还在播放，先停止（避免重叠）
    if (sound.isPlaying) {
      sound.stop();
    }
    
    // 🆕 设置音量并播放
    const volume = this.volumes.footsteps * this.volumes.master;
    sound.setVolume(volume);
    sound.play();
    
    // 简化日志（避免刷屏）
    // console.log(`👣 播放本地脚步声 (池索引: ${this.localFootstepPoolIndex - 1})`);
    
    return true;
  }
  
  /**
   * 🆕 停止本地脚步声（玩家停止移动时调用）
   * 只停止自己的脚步声，不影响其他玩家
   */
  stopLocalFootsteps() {
    let stoppedCount = 0;
    
    this.localFootstepPool.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
        stoppedCount++;
      }
    });
    
    if (stoppedCount > 0) {
      console.log(`⏸️ 停止本地脚步声 (${stoppedCount} 个)`);
    }
  }
  
  /**
   * 播放本地椅子声音（自己坐下/站起）
   * 声源位置 = 玩家位置 → 距离 0 → 满音量
   * 
   * @param {string} action - 'sit' 或 'standup'
   */
  playLocalChair(action) {
    const player = this.scene.player;
    const soundType = `chair-${action}`;
    
    // 本地椅子声音也考虑距离（虽然距离为 0）
    // 这样代码统一，未来如果需要调整很方便
    const volume = this.volumes.effects * this.volumes.master;
    this.playSound(soundType, volume);
  }
  
  /**
   * 播放本地打印机声音（自己打印）
   * 声源位置 = 打印机位置 → 距离取决于玩家离打印机多远
   * 
   * 注意：这里传入的是打印机坐标，不是玩家坐标
   * 因为声源是打印机，玩家可能站在旁边（距离很近但不是0）
   * 
   * @param {string} stage - 'start' / 'running' / 'complete'
   * @param {number} printerX - 打印机 X 坐标
   * @param {number} printerY - 打印机 Y 坐标
   */
  playLocalPrinter(stage, printerX, printerY) {
    const soundType = `printer-${stage}`;
    
    // 获取本地玩家位置
    const player = this.scene.player;
    if (!player) return;
    
    // 计算距离
    const distance = Phaser.Math.Distance.Between(
      player.x, player.y,
      printerX, printerY
    );
    
    // 计算音量（考虑距离）
    const config = this.soundConfig['printer'];
    const distanceVolume = this.getVolumeByDistance(
      distance,
      config.maxDistance,
      config.falloffPower,
      config.minVolume
    );
    
    if (distanceVolume === 0) return;
    
    const finalVolume = distanceVolume * this.volumes.effects * this.volumes.master;
    this.playSound(soundType, finalVolume);
    
    console.log(`🖨️ 播放打印机声音: ${stage}, 距离: ${distance.toFixed(0)}px, 音量: ${finalVolume.toFixed(2)}`);
  }
  
  // ========================================
  // 音量控制
  // ========================================
  
  /**
   * 设置音量
   * @param {string} category - 音量类别（master/ambient/effects/footsteps）
   * @param {number} value - 音量值（0-1）
   */
  setVolume(category, value) {
    if (this.volumes.hasOwnProperty(category)) {
      this.volumes[category] = Phaser.Math.Clamp(value, 0, 1);
      console.log(`🔊 设置音量: ${category} = ${this.volumes[category]}`);
      
      // 🆕 立即保存到 LocalStorage
      this.saveVolumesToLocalStorage();
      
      // 如果修改了 ambient 或 master，更新当前环境音音量
      if ((category === 'ambient' || category === 'master') && this.currentAmbient) {
        const regionType = this.getCurrentRegionType();
        const config = this.ambientConfig[regionType];
        if (config) {
          this.currentAmbient.setVolume(
            config.volume * this.volumes.ambient * this.volumes.master
          );
        }
      }
    } else {
      console.warn(`⚠️ 未知的音量类别: ${category}`);
    }
  }
  
  /**
   * 获取当前区域类型（辅助方法）
   */
  getCurrentRegionType() {
    if (this.scene.currentRegion) {
      return this.scene.currentRegion.type;
    }
    return 'public';
  }
  
  /**
   * 静音所有声音
   */
  muteAll() {
    this.setVolume('master', 0);
  }
  
  /**
   * 取消静音
   */
  unmuteAll() {
    this.setVolume('master', 1);
  }
  
  // ========================================
  // 清理
  // ========================================
  
  /**
   * 停止所有声音
   */
  stopAll() {
    console.log('🔇 停止所有声音');
    
    // 停止环境音
    if (this.currentAmbient) {
      this.currentAmbient.stop();
      this.currentAmbient.destroy();
      this.currentAmbient = null;
    }
    
    // 停止本地脚步声池
    this.localFootstepPool.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
    
    // 停止所有其他声音
    this.scene.sound.stopAll();
  }

  // ========================================
  // 🆕 LocalStorage 持久化（添加到 SoundManager.js 末尾，destroy() 之前）
  // ========================================
  
  /**
   * 从 LocalStorage 加载音量设置
   */
  loadVolumesFromLocalStorage() {
    try {
      const saved = localStorage.getItem('dlib-sound-volumes');
      if (saved) {
        const savedVolumes = JSON.parse(saved);
        
        // 合并保存的音量（保留默认值作为后备）
        this.volumes = {
          ...this.volumes,
          ...savedVolumes
        };
        
        console.log('🔊 从 LocalStorage 加载音量设置:', this.volumes);
        return true;
      }
    } catch (error) {
      console.error('⚠️ 加载音量设置失败:', error);
    }
    
    console.log('ℹ️ 使用默认音量设置');
    return false;
  }
  
  /**
   * 保存音量设置到 LocalStorage
   */
  saveVolumesToLocalStorage() {
    try {
      localStorage.setItem('dlib-sound-volumes', JSON.stringify(this.volumes));
      console.log('💾 音量设置已保存到 LocalStorage');
    } catch (error) {
      console.error('⚠️ 保存音量设置失败:', error);
    }
  }
  
  /**
   * 销毁 SoundManager
   */
  destroy() {
    this.stopAll();
    
    // 销毁脚步声池
    this.localFootstepPool.forEach(sound => sound.destroy());
    this.localFootstepPool = [];
    
    this.sounds.clear();
    console.log('🗑️ SoundManager 已销毁');
  }
}