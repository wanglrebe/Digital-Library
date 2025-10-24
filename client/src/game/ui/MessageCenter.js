/**
 * 统一消息中心
 * 整合：系统公告 + 区域聊天 + 私信
 */
export default class MessageCenter {
  constructor(scene) {
    this.scene = scene;
    this.currentChannel = 'announcement';
    this.currentPrivateChat = null; // 当前私聊对象

    // 🆕 追踪上一次的自习区状态（用于检测状态变化）
    this._lastKnownStudyAreaStatus = false;

    // 🆕 初始化区域名称
    this.currentRegionName = '公共区域';
    
    // 频道数据
    this.channels = {
      announcement: {
        name: '📢 公告',
        type: 'readonly',
        messages: [],
        unread: 0
      },
      area: {
        name: '💬 公共区域',  // 🆕 初始名称
        type: 'public',
        messages: [],
        unread: 0
      },
      private: {
        name: '✉️ 私信',
        type: 'private',
        conversations: new Map(),
        unread: 0
      }
    };
    
    // DOM 元素
    this.button = document.getElementById('message-center-btn');
    this.badge = document.getElementById('message-badge');
    this.panel = document.getElementById('message-center-panel');
    this.channelTabs = document.getElementById('channel-tabs');
    this.messageList = document.getElementById('message-list');
    this.inputContainer = document.getElementById('message-input-container');
    this.messageInput = document.getElementById('message-input');
    this.sendBtn = document.getElementById('send-message-btn');
    this.clearBtn = document.getElementById('clear-messages-btn');
    this.privateList = document.getElementById('private-conversation-list');
    this.newChatBtn = document.getElementById('new-chat-btn');  // 🆕
    this.onlineUsersList = document.getElementById('online-users-list');  // 🆕
    this.backToListBtn = document.getElementById('back-to-list-btn');  // 🆕
    
    this.isOpen = false;
    this.showOnlineUsers = false;  // 🆕 是否显示在线用户列表
    
    this.setupEventListeners();
    this.renderChannelTabs();
  }
  
  setupEventListeners() {
    // 打开/关闭面板
    this.button?.addEventListener('click', () => {
      this.toggle();
    });
    
    // 清空按钮
    this.clearBtn?.addEventListener('click', () => {
      this.clearCurrentChannel();
    });
    
    // 发送按钮
    this.sendBtn?.addEventListener('click', () => {
      this.sendMessage();
    });
    
    // 回车发送
    this.messageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // 🆕 新建聊天按钮
    this.newChatBtn?.addEventListener('click', () => {
      this.showOnlineUsersList();
    });
    
    // 🆕 返回按钮
    this.backToListBtn?.addEventListener('click', () => {
      this.backToConversationList();
    });
  }
  
  /**
   * 打开/关闭面板
   */
  toggle() {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.panel.classList.remove('hidden');
      this.updateUI();
      this.clearUnread(); // 打开时清空当前频道的未读
    } else {
      this.panel.classList.add('hidden');
    }
  }
  
  /**
   * 渲染频道 Tab
   */
  renderChannelTabs() {
    if (!this.channelTabs) return;
    
    const tabs = ['announcement', 'area', 'private'];
    
    this.channelTabs.innerHTML = tabs.map(id => {
      const channel = this.channels[id];
      const unreadBadge = channel.unread > 0 
        ? `<span class="tab-badge">${channel.unread > 99 ? '99+' : channel.unread}</span>` 
        : '';
      const activeClass = id === this.currentChannel ? 'active' : '';
      
      // 🆕 检查讨论区是否应该被禁用
      const isDisabled = id === 'area' && this.isInStudyArea();
      const disabledClass = isDisabled ? 'disabled' : '';
      const disabledAttr = isDisabled ? 'disabled' : '';
      const disabledTitle = isDisabled ? ' title="自习区禁止使用讨论区"' : '';
      
      return `
        <button 
          class="channel-tab ${activeClass} ${disabledClass}" 
          data-channel="${id}"
          ${disabledAttr}
          ${disabledTitle}
        >
          ${channel.name} ${unreadBadge}
        </button>
      `;
    }).join('');
    
    // 绑定点击事件
    this.channelTabs.querySelectorAll('.channel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // 🆕 如果是禁用状态，不允许切换
        if (tab.disabled) return;
        
        this.switchChannel(tab.dataset.channel);
      });
    });
  }
  
  /**
   * 切换频道
   */
  switchChannel(channelId) {
    this.currentChannel = channelId;
    this.currentPrivateChat = null; // 切换频道时重置私聊对象
    this.renderChannelTabs();
    this.updateUI();
    this.clearUnread(); // 切换时清空未读
  }

  // 【2】🆕 添加新方法：更新区域名称
  /**
   * 更新区域名称（由 Level2Scene 调用）
   */
  updateRegionName(regionName) {
    this.currentRegionName = regionName;
    
    // 🆕 动态更新频道名称
    this.channels.area.name = `💬 ${regionName}`;
    
    console.log(`💬 频道名称更新为: ${this.channels.area.name}`);
    
    // 🆕 重新渲染 Tab（静默更新，无需其他提示）
    this.renderChannelTabs();
  }
  
  /**
   * 更新 UI
   */
  updateUI() {
    const channel = this.channels[this.currentChannel];
    
    // 🆕 检查是否有隐藏的讨论区消息
    this.checkHiddenAreaMessages();
    
    // 如果当前在讨论区频道，但进入了自习区，自动切换到公告频道
    if (this.currentChannel === 'area' && this.isInStudyArea()) {
      console.log('🚫 自习区禁用讨论区，自动切换到公告频道');
      this.switchChannel('announcement');
      return;
    }
    
    // 根据频道类型显示不同内容
    if (this.currentChannel === 'private') {
      if (this.showOnlineUsers) {
        // 显示在线用户列表
        this.renderOnlineUsers();
        this.messageList.classList.add('hidden');
        this.privateList.classList.add('hidden');
        this.onlineUsersList.classList.remove('hidden');
        this.inputContainer.classList.add('hidden');
        this.newChatBtn.classList.add('hidden');
        this.backToListBtn.classList.remove('hidden');
      } else if (this.currentPrivateChat) {
        // 显示私聊消息
        this.renderPrivateMessages(this.currentPrivateChat);
        this.messageList.classList.remove('hidden');
        this.privateList.classList.add('hidden');
        this.onlineUsersList.classList.add('hidden');
        this.inputContainer.classList.remove('hidden');
        this.newChatBtn.classList.add('hidden');
        this.backToListBtn.classList.remove('hidden');
      } else {
        // 显示对话列表
        this.renderPrivateList();
        this.messageList.classList.add('hidden');
        this.privateList.classList.remove('hidden');
        this.onlineUsersList.classList.add('hidden');
        this.inputContainer.classList.add('hidden');
        this.newChatBtn.classList.remove('hidden');
        this.backToListBtn.classList.add('hidden');
      }
    } else {
      // 公告/讨论区：显示消息列表
      this.renderMessages();
      this.messageList.classList.remove('hidden');
      this.privateList.classList.add('hidden');
      this.onlineUsersList.classList.add('hidden');
      this.newChatBtn.classList.add('hidden');
      this.backToListBtn.classList.add('hidden');
      
      // 是否显示输入框
      const canSend = this.canSendInCurrentChannel();
      if (canSend) {
        this.inputContainer.classList.remove('hidden');
        this.updateInputPlaceholder();
      } else {
        this.inputContainer.classList.add('hidden');
      }
    }
    
    // 🆕 每次更新 UI 时都重新渲染 Tab（更新禁用状态）
    this.renderChannelTabs();
    
    this.updateBadge();
  }
  
  /**
   * 渲染消息列表
   */
  renderMessages() {
    if (!this.messageList) return;
    
    const channel = this.channels[this.currentChannel];
    
    if (channel.messages.length === 0) {
      this.messageList.innerHTML = '<div class="message-empty">暂无消息</div>';
      return;
    }
    
    this.messageList.innerHTML = channel.messages.map(msg => {
      const typeClass = msg.type === 'me' ? 'message-me' : 'message-other';
      const senderName = msg.type === 'system' ? '系统' : msg.sender.username;
      
      return `
        <div class="message-item ${typeClass}">
          <div class="message-header">
            <span class="message-sender">${senderName}</span>
            <span class="message-time">${msg.time}</span>
          </div>
          <div class="message-content">${this.escapeHtml(msg.content)}</div>
        </div>
      `;
    }).join('');
    
    // 滚动到底部
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }
  
  /**
   * 渲染私信对话列表
   */
  renderPrivateList() {
    if (!this.privateList) return;
    
    const conversations = Array.from(this.channels.private.conversations.values());
    
    if (conversations.length === 0) {
      this.privateList.innerHTML = '<div class="message-empty">暂无私信</div>';
      return;
    }
    
    this.privateList.innerHTML = conversations.map(conv => {
      // 🔧 修复：检查是否有消息
      if (conv.messages.length === 0) {
        // 没有消息的对话，显示提示文字
        return `
          <div class="conversation-item" data-player-id="${conv.playerId}">
            <div class="conversation-header">
              <span class="conversation-name">${conv.username}</span>
              ${conv.unread > 0 ? `<span class="conversation-badge">${conv.unread}</span>` : ''}
            </div>
            <div class="conversation-preview">点击开始聊天...</div>
            <div class="conversation-time">刚刚</div>
          </div>
        `;
      }
      
      // 有消息的对话，正常显示
      const lastMsg = conv.messages[conv.messages.length - 1];
      const unreadBadge = conv.unread > 0 
        ? `<span class="conversation-badge">${conv.unread}</span>` 
        : '';
      
      return `
        <div class="conversation-item" data-player-id="${conv.playerId}">
          <div class="conversation-header">
            <span class="conversation-name">${conv.username}</span>
            ${unreadBadge}
          </div>
          <div class="conversation-preview">${this.escapeHtml(lastMsg.content)}</div>
          <div class="conversation-time">${lastMsg.time}</div>
        </div>
      `;
    }).join('');
    
    // 绑定点击事件
    this.privateList.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', () => {
        this.openPrivateChat(item.dataset.playerId);
      });
    });
  }
  
  /**
   * 打开私聊对话
   */
  openPrivateChat(playerId) {
    const conversation = this.channels.private.conversations.get(playerId);
    if (!conversation) return;
    
    this.currentPrivateChat = playerId;
    this.showOnlineUsers = false;  // 🔧 修复：确保关闭在线用户列表状态
    
    // 清空该对话的未读
    conversation.unread = 0;
    this.recalculatePrivateUnread();
    
    // 显示消息列表和输入框
    this.messageList.classList.remove('hidden');
    this.privateList.classList.add('hidden');
    this.onlineUsersList.classList.add('hidden');  // 🔧 修复：确保隐藏在线用户列表
    this.inputContainer.classList.remove('hidden');
    
    // 🔧 修复：更新按钮显示
    this.newChatBtn.classList.add('hidden');
    this.backToListBtn.classList.remove('hidden');
    
    // 渲染该对话的消息
    this.renderPrivateMessages(playerId);
    
    this.updateInputPlaceholder();
    this.updateBadge();
  }
  
  /**
   * 渲染私聊消息
   */
  renderPrivateMessages(playerId) {
    const conversation = this.channels.private.conversations.get(playerId);
    if (!conversation) return;
    
    this.messageList.innerHTML = conversation.messages.map(msg => {
      const typeClass = msg.type === 'me' ? 'message-me' : 'message-other';
      
      return `
        <div class="message-item ${typeClass}">
          <div class="message-header">
            <span class="message-sender">${msg.type === 'me' ? '我' : conversation.username}</span>
            <span class="message-time">${msg.time}</span>
          </div>
          <div class="message-content">${this.escapeHtml(msg.content)}</div>
        </div>
      `;
    }).join('');
    
    // 滚动到底部
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }
  
  /**
   * 发送消息
   */
  sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content) return;
    
    if (this.currentChannel === 'area') {
      // 发送公共消息
      this.scene.socketManager.emitPublicMessage(content);
      
      // 立即显示自己的消息
      this.addMessage({
        channel: 'area',
        type: 'me',
        sender: {
          id: this.scene.socketManager.socket.id,
          username: this.scene.player.username
        },
        content: content
      });
    } else if (this.currentChannel === 'private' && this.currentPrivateChat) {
      // 发送私信
      this.scene.socketManager.emitPrivateMessage(this.currentPrivateChat, content);
      
      // 立即显示自己的消息
      this.addPrivateMessage(this.currentPrivateChat, {
        type: 'me',
        content: content
      }, false); // false = 不显示浮动通知
    }
    
    this.messageInput.value = '';
  }
  
  /**
   * 添加消息（统一入口）
   */
  addMessage(message) {
    const channel = this.channels[message.channel];
    if (!channel) return;
    
    // 🆕 勿扰模式检查：是否应该显示这条消息
    if (this.scene.dndManager && this.scene.dndManager.isEnabled) {
      if (!this.scene.dndManager.shouldShowMessage(message.channel, message.type)) {
        console.log(`🔕 勿扰模式：屏蔽消息 [${message.channel}]`);
        return; // 完全不添加消息（讨论区消息）
      }
    }
    
    // 生成时间戳
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const fullMessage = {
      ...message,
      time: time,
      timestamp: now.getTime()
    };
    
    // 添加到对应频道
    channel.messages.push(fullMessage);
    
    // 限制消息数量（最多保留 100 条）
    if (channel.messages.length > 100) {
      channel.messages.shift();
    }
    
    // 更新未读数（如果面板关闭或不是当前频道）
    if (!this.isOpen || this.currentChannel !== message.channel) {
      channel.unread++;
      this.updateBadge();
      
      // 🆕 勿扰模式检查：是否应该显示浮动通知
      let shouldShowToast = this.shouldShowToast(message);
      if (this.scene.dndManager && this.scene.dndManager.isEnabled) {
        shouldShowToast = this.scene.dndManager.shouldShowToast(message.channel);
      }
      
      // 显示浮动通知（重要消息）
      if (shouldShowToast) {
        this.showToast(message);
      }
    } else {
      // 面板打开且是当前频道，直接渲染
      this.renderMessages();
    }
  }
  
  /**
   * 添加私信
   */
  addPrivateMessage(playerId, message, showToast = true) {
    let conversation = this.channels.private.conversations.get(playerId);
    
    // 如果对话不存在，创建新对话
    if (!conversation) {
      conversation = {
        playerId: playerId,
        username: message.sender?.username || 'Unknown',
        messages: [],
        unread: 0
      };
      this.channels.private.conversations.set(playerId, conversation);
    }
    
    // 生成时间戳
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const fullMessage = {
      type: message.type || 'other',
      content: message.content,
      time: time,
      timestamp: now.getTime(),
      sender: message.sender
    };
    
    // 添加到对话
    conversation.messages.push(fullMessage);
    
    // 限制消息数量
    if (conversation.messages.length > 100) {
      conversation.messages.shift();
    }
    
    // 更新未读数
    if (message.type !== 'me') {
      if (!this.isOpen || this.currentChannel !== 'private' || this.currentPrivateChat !== playerId) {
        conversation.unread++;
        this.recalculatePrivateUnread();
        this.updateBadge();
        
        // 🔧 完全重写：勿扰模式优先级最高
        let shouldShowPrivateToast = false; // 默认不显示
        
        if (this.scene.dndManager && this.scene.dndManager.isEnabled) {
          // 勿扰模式开启：根据设置判断
          shouldShowPrivateToast = !this.scene.dndManager.settings.mutePrivateMsg;
        } else {
          // 勿扰模式关闭：使用传入的参数
          shouldShowPrivateToast = showToast;
        }
        
        // 显示浮动通知
        if (shouldShowPrivateToast) {
          this.showToast({
            type: 'private',
            sender: { username: conversation.username },
            content: message.content
          });
        }
      }
    }
    
    // 如果当前正在查看该对话，刷新显示
    if (this.isOpen && this.currentChannel === 'private' && this.currentPrivateChat === playerId) {
      this.renderPrivateMessages(playerId);
    } else if (this.isOpen && this.currentChannel === 'private' && !this.currentPrivateChat) {
      // 如果在私信频道但未选择对话，刷新列表
      this.renderPrivateList();
    }
  }
  
  /**
   * 重新计算私信总未读数
   */
  recalculatePrivateUnread() {
    let total = 0;
    this.channels.private.conversations.forEach(conv => {
      total += conv.unread;
    });
    this.channels.private.unread = total;
  }
  
  /**
   * 是否应该显示浮动通知
   */
  shouldShowToast(message) {
    // 只对重要消息显示浮动通知
    if (message.channel === 'announcement') return true; // 系统公告
    if (message.type === 'private') return true; // 私信
    if (message.channel === 'area' && message.type !== 'me') return false; // 讨论区的其他人消息不浮动
    return false;
  }
  
  /**
   * 显示浮动通知
   */
  showToast(message) {
    if (!this.scene.notifications) return;
    
    let toastMessage = '';
    if (message.channel === 'announcement') {
      toastMessage = message.content;
    } else if (message.type === 'private') {
      toastMessage = `${message.sender.username}: ${message.content}`;
    }
    
    this.scene.notifications.info(toastMessage, 3000);
  }
  
  /**
   * 清空当前频道
   */
  clearCurrentChannel() {
    if (this.currentChannel === 'private') {
      this.channels.private.conversations.clear();
      this.channels.private.unread = 0;
      this.renderPrivateList();
    } else {
      this.channels[this.currentChannel].messages = [];
      this.channels[this.currentChannel].unread = 0;
      this.renderMessages();
    }
    this.updateBadge();
  }
  
  /**
   * 清空当前频道的未读
   */
  clearUnread() {
    if (this.currentChannel === 'private' && this.currentPrivateChat) {
      const conversation = this.channels.private.conversations.get(this.currentPrivateChat);
      if (conversation) {
        conversation.unread = 0;
        this.recalculatePrivateUnread();
      }
    } else {
      this.channels[this.currentChannel].unread = 0;
    }
    this.updateBadge();
  }
  
  /**
   * 更新未读角标
   */
  updateBadge() {
    if (!this.badge) return;
    
    // 🆕 计算总未读数时，如果在自习区，排除讨论区的未读消息
    let totalUnread = 0;
    
    Object.entries(this.channels).forEach(([channelId, channel]) => {
      // 🆕 如果是讨论区 && 在自习区，不计入未读数
      if (channelId === 'area' && this.isInStudyArea()) {
        return; // 跳过讨论区的未读
      }
      
      totalUnread += channel.unread;
    });
    
    if (totalUnread > 0) {
      this.badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
      this.badge.classList.remove('hidden');
    } else {
      this.badge.classList.add('hidden');
    }
    
    // 同时更新 Tab 上的角标
    this.renderChannelTabs();
  }

  // ========================================
  // 🆕 新增方法：离开自习区时显示被隐藏的讨论区消息提示
  // ========================================
  
  /**
   * 检查是否有被隐藏的讨论区消息
   * （在 updateUI 中调用）
   */
  checkHiddenAreaMessages() {
    // 如果刚离开自习区，且讨论区有未读消息，显示一个友好提示
    const wasInStudyArea = this._lastKnownStudyAreaStatus || false;
    const isInStudyArea = this.isInStudyArea();
    
    // 记录状态
    this._lastKnownStudyAreaStatus = isInStudyArea;
    
    // 如果从自习区离开 && 讨论区有未读
    if (wasInStudyArea && !isInStudyArea && this.channels.area.unread > 0) {
      // 显示浮动通知
      if (this.scene.notifications) {
        this.scene.notifications.info(
          `💬 讨论区有 ${this.channels.area.unread} 条未读消息`,
          3000
        );
      }
    }
  }
  
  /**
   * 判断当前频道是否可以发送消息
   */
  canSendInCurrentChannel() {
    if (this.currentChannel === 'announcement') return false; // 公告只读
    if (this.currentChannel === 'area') {
      // 检查是否在自习区
      return !this.isInStudyArea();
    }
    if (this.currentChannel === 'private') {
      return this.currentPrivateChat !== null; // 选中了对话才能发送
    }
    return false;
  }
  
  // 【2】修改 isInStudyArea() 方法 - 实现真正的检测
  /**
   * 检查玩家是否在自习区
   */
  isInStudyArea() {
    // 🆕 从 scene 获取当前区域类型
    if (!this.scene.currentRegion) {
      return false;
    }
    
    return this.scene.currentRegion.type === 'study';
  }
  
  /**
   * 更新输入框提示文字
   */
  updateInputPlaceholder() {
    if (!this.messageInput) return;
    
    if (this.currentChannel === 'area') {
      this.messageInput.placeholder = '在讨论区发言...';
    } else if (this.currentChannel === 'private' && this.currentPrivateChat) {
      const conversation = this.channels.private.conversations.get(this.currentPrivateChat);
      this.messageInput.placeholder = `发送给 ${conversation?.username || 'Unknown'}...`;
    }
  }
  
  /**
   * HTML 转义
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 系统公告（快捷方法）
   */
  addSystemAnnouncement(content) {
    this.addMessage({
      channel: 'announcement',
      type: 'system',
      sender: { id: 'system', username: '系统' },
      content: content
    });
  }
  
  /**
   * 🆕 显示在线用户列表
   */
  showOnlineUsersList() {
    this.showOnlineUsers = true;
    this.updateUI();
  }
  
  /**
   * 🆕 返回对话列表
   */
  backToConversationList() {
    this.showOnlineUsers = false;
    this.currentPrivateChat = null;
    this.updateUI();
  }
  
  /**
   * 🆕 渲染在线用户列表
   */
  renderOnlineUsers() {
    if (!this.onlineUsersList) return;
    
    const onlineUsers = this.getOnlineUsers();
    
    if (onlineUsers.length === 0) {
      this.onlineUsersList.innerHTML = '<div class="message-empty">暂无其他在线用户</div>';
      return;
    }
    
    this.onlineUsersList.innerHTML = onlineUsers.map(user => {
      return `
        <div class="online-user-item" data-player-id="${user.id}">
          <div class="online-user-info">
            <span class="online-user-name">${user.username}</span>
            <span class="online-user-status">${this.getPlayerLocationName(user)}</span>
          </div>
          <button class="chat-with-btn">💬</button>
        </div>
      `;
    }).join('');
    
    // 绑定点击事件
    this.onlineUsersList.querySelectorAll('.online-user-item').forEach(item => {
      const chatBtn = item.querySelector('.chat-with-btn');
      chatBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startPrivateChat(item.dataset.playerId);
      });
      
      // 点击整行也可以
      item.addEventListener('click', () => {
        this.startPrivateChat(item.dataset.playerId);
      });
    });
  }
  
  /**
   * 🆕 获取在线用户列表
   */
  getOnlineUsers() {
    const users = [];
    
    // 从场景中获取其他玩家
    if (this.scene.otherPlayers) {
      this.scene.otherPlayers.forEach((player, id) => {
        users.push({
          id: id,
          username: player.username,
          x: player.x,
          y: player.y,
          isSitting: player.isSitting
        });
      });
    }
    
    return users;
  }
  
  /**
   * 🆕 获取玩家位置名称
   */
  getPlayerLocationName(user) {
    // TODO: 根据玩家坐标判断所在区域
    // 目前简单显示状态
    if (user.isSitting) {
      return '📚 学习中';
    }
    return '🚶 移动中';
  }
  
  /**
   * 🆕 发起私聊
   */
  startPrivateChat(playerId) {
    const user = this.getOnlineUsers().find(u => u.id === playerId);
    if (!user) {
      console.warn('⚠️ 用户不存在:', playerId);
      return;
    }
    
    // 如果对话不存在，创建空对话
    if (!this.channels.private.conversations.has(playerId)) {
      this.channels.private.conversations.set(playerId, {
        playerId: playerId,
        username: user.username,
        messages: [],
        unread: 0
      });
    }
    
    // 打开对话
    this.openPrivateChat(playerId);
    
    // 隐藏在线用户列表
    this.showOnlineUsers = false;
    this.updateUI();
  }
}