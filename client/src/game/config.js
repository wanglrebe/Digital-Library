import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import Level2Scene from './scenes/Level2Scene';

const config = {
  type: Phaser.AUTO,
  // 改为缩放模式，自适应窗口大小
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
    width: '100%',
    height: '100%',
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#2d2d2d',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  },
  scene: [BootScene, Level2Scene]
};

export default config;