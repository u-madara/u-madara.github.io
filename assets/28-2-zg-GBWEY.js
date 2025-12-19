const n=`---
title: 微前端应用间通信方式详解（二）- 高级通信与最佳实践
excerpt: 在微前端架构中，状态管理是一个复杂而重要的问题。本文详细介绍微前端中的状态管理策略，包括集中式状态管理、分布式状态管理和混合状态管理，以及最佳实践。
coverImage: /assets/blog/preview/cover.jpg
date: "2025-11-21"
author:
  name: 前端架构团队
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# 微前端状态管理策略与最佳实践

## 引言

在微前端架构中，状态管理是一个复杂而重要的问题。由于各个应用通常是独立开发和部署的，它们需要管理自己的状态，同时也需要共享某些状态以实现业务协作。如何设计一个既能满足应用独立性又能实现状态共享的状态管理方案，是微前端架构中的核心挑战。

本文将详细介绍微前端中的状态管理策略，包括集中式状态管理、分布式状态管理和混合状态管理，并通过实际代码示例展示它们的实现方法和应用场景。同时，我们还将探讨微前端状态管理的最佳实践，帮助开发者构建高效、可靠的状态管理方案。

## 状态管理策略

### 1. 集中式状态管理

集中式状态管理将所有共享状态集中在一个地方管理，通常由主应用负责。这种方式适合于需要严格控制和同步的共享状态，如用户信息、购物车数据等。

#### 1.1 实现集中式状态管理

\`\`\`javascript
// 集中式状态管理器
class CentralizedStateManager {
  constructor() {
    this.state = {
      user: null,
      cart: [],
      theme: 'light',
      notifications: []
    };
    this.subscribers = new Map();
    this.middlewares = [];
  }
  
  // 添加中间件
  use(middleware) {
    this.middlewares.push(middleware);
  }
  
  // 获取状态
  getState(path) {
    if (!path) {
      return { ...this.state };
    }
    
    return path.split('.').reduce((obj, key) => {
      return obj && obj[key];
    }, this.state);
  }
  
  // 更新状态
  async setState(path, value) {
    // 执行中间件
    for (const middleware of this.middlewares) {
      await middleware(path, value, this.state);
    }
    
    // 更新状态
    const prevState = { ...this.state };
    this.updateNestedState(this.state, path, value);
    
    // 通知订阅者
    this.notifySubscribers(path, this.getState(path), prevState);
    
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('state:changed', {
      detail: { path, value, prevState }
    }));
    
    return this.state;
  }
  
  // 更新嵌套状态
  updateNestedState(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }
  
  // 订阅状态变化
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    this.subscribers.get(path).add(callback);
    
    // 返回取消订阅函数
    return () => {
      if (this.subscribers.has(path)) {
        this.subscribers.get(path).delete(callback);
        if (this.subscribers.get(path).size === 0) {
          this.subscribers.delete(path);
        }
      }
    };
  }
  
  // 通知订阅者
  notifySubscribers(changedPath, newValue, prevState) {
    for (const [path, callbacks] of this.subscribers.entries()) {
      // 如果订阅的路径是变化路径的父路径或相同路径
      if (path === changedPath || changedPath.startsWith(path + '.')) {
        for (const callback of callbacks) {
          try {
            callback(newValue, this.getState(path), changedPath);
          } catch (error) {
            console.error(\`Error in state subscriber for \${path}:\`, error);
          }
        }
      }
    }
  }
}

// 创建全局状态管理器
const globalStateManager = new CentralizedStateManager();

// 添加持久化中间件
globalStateManager.use(async (path, value, state) => {
  // 只持久化特定路径的状态
  const persistPaths = ['user', 'theme'];
  if (persistPaths.some(p => path.startsWith(p))) {
    localStorage.setItem('app-state', JSON.stringify(state));
  }
});

// 添加日志中间件
globalStateManager.use(async (path, value, state) => {
  console.log(\`State \${path} changed to:\`, value);
});

// 在微前端应用中使用状态管理器
class ProductApp {
  constructor() {
    this.stateManager = globalStateManager;
    this.init();
  }
  
  init() {
    // 订阅用户状态
    this.stateManager.subscribe('user', (user) => {
      this.updateUserUI(user);
    });
    
    // 订阅主题状态
    this.stateManager.subscribe('theme', (theme) => {
      this.updateTheme(theme);
    });
    
    // 订阅购物车状态
    this.stateManager.subscribe('cart', (cart) => {
      this.updateCartUI(cart);
    });
  }
  
  // 添加商品到购物车
  async addToCart(product) {
    const user = this.stateManager.getState('user');
    if (!user) {
      this.showNotification('请先登录', 'warning');
      return;
    }
    
    const cart = this.stateManager.getState('cart') || [];
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    await this.stateManager.setState('cart', cart);
    this.showNotification(\`\${product.name} 已添加到购物车\`, 'success');
  }
  
  // 显示通知
  showNotification(message, type = 'info') {
    const notifications = this.stateManager.getState('notifications') || [];
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    notifications.push(notification);
    this.stateManager.setState('notifications', notifications);
    
    // 自动移除通知
    setTimeout(() => {
      const currentNotifications = this.stateManager.getState('notifications') || [];
      const updatedNotifications = currentNotifications.filter(
        n => n.id !== notification.id
      );
      this.stateManager.setState('notifications', updatedNotifications);
    }, 3000);
  }
  
  // 更新用户UI
  updateUserUI(user) {
    const userElement = document.getElementById('user-info');
    if (userElement) {
      if (user) {
        userElement.textContent = \`欢迎, \${user.name}\`;
      } else {
        userElement.textContent = '未登录';
      }
    }
  }
  
  // 更新主题
  updateTheme(theme) {
    document.body.className = document.body.className.replace(
      /theme-\\w+/g, ''
    ) + \` theme-\${theme}\`;
  }
  
  // 更新购物车UI
  updateCartUI(cart) {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
      const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
      countElement.textContent = itemCount;
    }
  }
}
\`\`\`

### 2. 分布式状态管理

分布式状态管理允许每个微前端应用管理自己的状态，同时提供机制与其他应用共享必要的状态。这种方式适合于需要高度自治的应用场景。

#### 2.1 实现分布式状态管理

\`\`\`javascript
// 分布式状态管理器
class DistributedStateManager {
  constructor(appName) {
    this.appName = appName;
    this.localState = {};
    this.sharedStateKeys = new Set();
    this.subscribers = new Map();
    
    // 监听共享状态变化
    window.addEventListener('shared-state:changed', (event) => {
      const { key, value, sourceApp } = event.detail;
      
      // 忽略自己触发的事件
      if (sourceApp === this.appName) {
        return;
      }
      
      // 如果是共享状态，更新本地状态
      if (this.sharedStateKeys.has(key)) {
        this.localState[key] = value;
        this.notifySubscribers(key, value);
      }
    });
  }
  
  // 设置本地状态
  setLocalState(key, value) {
    this.localState[key] = value;
    this.notifySubscribers(key, value);
  }
  
  // 设置共享状态
  setSharedState(key, value) {
    this.localState[key] = value;
    this.sharedStateKeys.add(key);
    
    // 通知其他应用
    window.dispatchEvent(new CustomEvent('shared-state:changed', {
      detail: { key, value, sourceApp: this.appName }
    }));
    
    this.notifySubscribers(key, value);
  }
  
  // 获取状态
  getState(key) {
    return this.localState[key];
  }
  
  // 订阅状态变化
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    
    // 返回取消订阅函数
    return () => {
      if (this.subscribers.has(key)) {
        this.subscribers.get(key).delete(callback);
        if (this.subscribers.get(key).size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }
  
  // 通知订阅者
  notifySubscribers(key, value) {
    if (this.subscribers.has(key)) {
      for (const callback of this.subscribers.get(key)) {
        try {
          callback(value);
        } catch (error) {
          console.error(\`Error in state subscriber for \${key}:\`, error);
        }
      }
    }
  }
}

// 在产品应用中使用分布式状态管理
class ProductApp {
  constructor() {
    this.stateManager = new DistributedStateManager('product-app');
    this.init();
  }
  
  init() {
    // 订阅共享的用户状态
    this.stateManager.subscribe('user', (user) => {
      this.updateUserUI(user);
    });
    
    // 订阅共享的主题状态
    this.stateManager.subscribe('theme', (theme) => {
      this.updateTheme(theme);
    });
    
    // 设置本地状态
    this.stateManager.setLocalState('products', []);
    this.stateManager.setLocalState('filters', {});
    
    // 加载产品数据
    this.loadProducts();
  }
  
  // 加载产品数据
  async loadProducts() {
    try {
      const products = await fetch('/api/products').then(res => res.json());
      this.stateManager.setLocalState('products', products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }
  
  // 添加商品到购物车
  addToCart(product) {
    const user = this.stateManager.getState('user');
    if (!user) {
      this.showNotification('请先登录', 'warning');
      return;
    }
    
    // 发布添加到购物车事件
    window.dispatchEvent(new CustomEvent('cart:add-item', {
      detail: { product, sourceApp: 'product-app' }
    }));
    
    this.showNotification(\`\${product.name} 已添加到购物车\`, 'success');
  }
  
  // 更新用户UI
  updateUserUI(user) {
    const userElement = document.getElementById('user-info');
    if (userElement) {
      if (user) {
        userElement.textContent = \`欢迎, \${user.name}\`;
      } else {
        userElement.textContent = '未登录';
      }
    }
  }
  
  // 更新主题
  updateTheme(theme) {
    document.body.className = document.body.className.replace(
      /theme-\\w+/g, ''
    ) + \` theme-\${theme}\`;
  }
  
  // 显示通知
  showNotification(message, type = 'info') {
    // 发布通知事件
    window.dispatchEvent(new CustomEvent('notification:show', {
      detail: { message, type, sourceApp: 'product-app' }
    }));
  }
}

// 在购物车应用中使用分布式状态管理
class CartApp {
  constructor() {
    this.stateManager = new DistributedStateManager('cart-app');
    this.init();
  }
  
  init() {
    // 订阅共享的用户状态
    this.stateManager.subscribe('user', (user) => {
      this.updateUserUI(user);
    });
    
    // 订阅共享的主题状态
    this.stateManager.subscribe('theme', (theme) => {
      this.updateTheme(theme);
    });
    
    // 设置本地状态
    this.stateManager.setLocalState('cart', []);
    
    // 监听添加到购物车事件
    window.addEventListener('cart:add-item', (event) => {
      const { product, sourceApp } = event.detail;
      if (sourceApp !== 'cart-app') {
        this.addItemToCart(product);
      }
    });
  }
  
  // 添加商品到购物车
  addItemToCart(product) {
    const cart = this.stateManager.getState('cart') || [];
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1, addedAt: Date.now() });
    }
    
    this.stateManager.setLocalState('cart', cart);
    this.updateCartUI(cart);
  }
  
  // 从购物车移除商品
  removeFromCart(itemId) {
    const cart = this.stateManager.getState('cart') || [];
    const updatedCart = cart.filter(item => item.id !== itemId);
    
    this.stateManager.setLocalState('cart', updatedCart);
    this.updateCartUI(updatedCart);
  }
  
  // 更新购物车UI
  updateCartUI(cart) {
    const cartElement = document.getElementById('cart-items');
    if (!cartElement) return;
    
    // 清空购物车
    cartElement.innerHTML = '';
    
    // 添加购物车商品
    cart.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = \`
        <div class="item-info">
          <h3>\${item.name}</h3>
          <p>价格: $\${item.price}</p>
          <p>数量: \${item.quantity}</p>
        </div>
        <div class="item-actions">
          <button class="remove-btn" data-id="\${item.id}">移除</button>
        </div>
      \`;
      
      // 添加移除按钮事件
      const removeBtn = itemElement.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        this.removeFromCart(item.id);
      });
      
      cartElement.appendChild(itemElement);
    });
    
    // 更新总价
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
      const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
      totalElement.textContent = \`总价: $\${totalPrice.toFixed(2)}\`;
    }
    
    // 更新商品数量
    const countElement = document.getElementById('cart-count');
    if (countElement) {
      const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
      countElement.textContent = itemCount;
    }
  }
  
  // 更新用户UI
  updateUserUI(user) {
    const userElement = document.getElementById('user-info');
    if (userElement) {
      if (user) {
        userElement.textContent = \`欢迎, \${user.name}\`;
      } else {
        userElement.textContent = '未登录';
      }
    }
  }
  
  // 更新主题
  updateTheme(theme) {
    document.body.className = document.body.className.replace(
      /theme-\\w+/g, ''
    ) + \` theme-\${theme}\`;
  }
}
\`\`\`

### 3. 混合状态管理

混合状态管理结合了集中式和分布式状态管理的优点，对于核心共享状态采用集中式管理，对于应用特定状态采用分布式管理。

#### 3.1 实现混合状态管理

\`\`\`javascript
// 混合状态管理器
class HybridStateManager {
  constructor(appName, options = {}) {
    this.appName = appName;
    this.options = options;
    
    // 本地状态
    this.localState = {};
    this.localSubscribers = new Map();
    
    // 共享状态
    this.sharedState = {};
    this.sharedSubscribers = new Map();
    
    // 初始化共享状态
    this.initSharedState();
  }
  
  // 初始化共享状态
  initSharedState() {
    // 监听共享状态变化
    window.addEventListener('shared-state:changed', (event) => {
      const { key, value, sourceApp } = event.detail;
      
      // 忽略自己触发的事件
      if (sourceApp === this.appName) {
        return;
      }
      
      // 更新共享状态
      this.sharedState[key] = value;
      this.notifySharedSubscribers(key, value);
    });
    
    // 请求初始共享状态
    this.requestSharedState();
  }
  
  // 请求初始共享状态
  async requestSharedState() {
    // 向主应用请求共享状态
    try {
      const response = await this.sendMessage('get-shared-state', {});
      if (response && response.state) {
        this.sharedState = response.state;
      }
    } catch (error) {
      console.error('Failed to get shared state:', error);
    }
  }
  
  // 发送消息到主应用
  async sendMessage(type, data) {
    return new Promise((resolve, reject) => {
      const messageId = \`msg_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
      
      // 设置超时
      const timeout = setTimeout(() => {
        reject(new Error('Message timeout'));
      }, 5000);
      
      // 监听响应
      const handleResponse = (event) => {
        if (event.data.type === 'response' && event.data.messageId === messageId) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
          resolve(event.data.data);
        }
      };
      
      window.addEventListener('message', handleResponse);
      
      // 发送消息
      window.parent.postMessage({
        type,
        data,
        messageId,
        sourceApp: this.appName
      }, '*');
    });
  }
  
  // 设置本地状态
  setLocalState(key, value) {
    this.localState[key] = value;
    this.notifyLocalSubscribers(key, value);
  }
  
  // 设置共享状态
  async setSharedState(key, value) {
    this.sharedState[key] = value;
    
    try {
      // 通知主应用更新共享状态
      await this.sendMessage('update-shared-state', { key, value });
      
      // 通知其他应用
      window.dispatchEvent(new CustomEvent('shared-state:changed', {
        detail: { key, value, sourceApp: this.appName }
      }));
      
      this.notifySharedSubscribers(key, value);
    } catch (error) {
      console.error('Failed to update shared state:', error);
    }
  }
  
  // 获取本地状态
  getLocalState(key) {
    return this.localState[key];
  }
  
  // 获取共享状态
  getSharedState(key) {
    return this.sharedState[key];
  }
  
  // 订阅本地状态变化
  subscribeLocalState(key, callback) {
    if (!this.localSubscribers.has(key)) {
      this.localSubscribers.set(key, new Set());
    }
    this.localSubscribers.get(key).add(callback);
    
    // 返回取消订阅函数
    return () => {
      if (this.localSubscribers.has(key)) {
        this.localSubscribers.get(key).delete(callback);
        if (this.localSubscribers.get(key).size === 0) {
          this.localSubscribers.delete(key);
        }
      }
    };
  }
  
  // 订阅共享状态变化
  subscribeSharedState(key, callback) {
    if (!this.sharedSubscribers.has(key)) {
      this.sharedSubscribers.set(key, new Set());
    }
    this.sharedSubscribers.get(key).add(callback);
    
    // 返回取消订阅函数
    return () => {
      if (this.sharedSubscribers.has(key)) {
        this.sharedSubscribers.get(key).delete(callback);
        if (this.sharedSubscribers.get(key).size === 0) {
          this.sharedSubscribers.delete(key);
        }
      }
    };
  }
  
  // 通知本地状态订阅者
  notifyLocalSubscribers(key, value) {
    if (this.localSubscribers.has(key)) {
      for (const callback of this.localSubscribers.get(key)) {
        try {
          callback(value);
        } catch (error) {
          console.error(\`Error in local state subscriber for \${key}:\`, error);
        }
      }
    }
  }
  
  // 通知共享状态订阅者
  notifySharedSubscribers(key, value) {
    if (this.sharedSubscribers.has(key)) {
      for (const callback of this.sharedSubscribers.get(key)) {
        try {
          callback(value);
        } catch (error) {
          console.error(\`Error in shared state subscriber for \${key}:\`, error);
        }
      }
    }
  }
}

// 在主应用中实现共享状态管理
class MainAppStateManager {
  constructor() {
    this.sharedState = {
      user: null,
      theme: 'light',
      notifications: []
    };
    
    // 监听微前端应用的消息
    window.addEventListener('message', this.handleMessage.bind(this));
  }
  
  // 处理消息
  async handleMessage(event) {
    const { type, data, messageId, sourceApp } = event.data;
    
    try {
      let responseData;
      
      switch (type) {
        case 'get-shared-state':
          responseData = { state: this.sharedState };
          break;
          
        case 'update-shared-state':
          const { key, value } = data;
          this.sharedState[key] = value;
          
          // 通知其他应用
          window.dispatchEvent(new CustomEvent('shared-state:changed', {
            detail: { key, value, sourceApp }
          }));
          
          responseData = { success: true };
          break;
          
        default:
          throw new Error(\`Unknown message type: \${type}\`);
      }
      
      // 发送响应
      event.source.postMessage({
        type: 'response',
        data: responseData,
        messageId
      }, '*');
      
    } catch (error) {
      // 发送错误响应
      event.source.postMessage({
        type: 'response',
        data: { error: error.message },
        messageId
      }, '*');
    }
  }
  
  // 设置共享状态
  setSharedState(key, value) {
    this.sharedState[key] = value;
    
    // 通知所有应用
    window.dispatchEvent(new CustomEvent('shared-state:changed', {
      detail: { key, value, sourceApp: 'main-app' }
    }));
  }
}

// 创建主应用状态管理器
const mainAppStateManager = new MainAppStateManager();

// 在微前端应用中使用混合状态管理
class ProductApp {
  constructor() {
    this.stateManager = new HybridStateManager('product-app');
    this.init();
  }
  
  init() {
    // 订阅共享的用户状态
    this.stateManager.subscribeSharedState('user', (user) => {
      this.updateUserUI(user);
    });
    
    // 订阅共享的主题状态
    this.stateManager.subscribeSharedState('theme', (theme) => {
      this.updateTheme(theme);
    });
    
    // 设置本地状态
    this.stateManager.setLocalState('products', []);
    this.stateManager.setLocalState('filters', {});
    
    // 加载产品数据
    this.loadProducts();
  }
  
  // 加载产品数据
  async loadProducts() {
    try {
      const products = await fetch('/api/products').then(res => res.json());
      this.stateManager.setLocalState('products', products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }
  
  // 添加商品到购物车
  async addToCart(product) {
    const user = this.stateManager.getSharedState('user');
    if (!user) {
      await this.showNotification('请先登录', 'warning');
      return;
    }
    
    // 发布添加到购物车事件
    window.dispatchEvent(new CustomEvent('cart:add-item', {
      detail: { product, sourceApp: 'product-app' }
    }));
    
    await this.showNotification(\`\${product.name} 已添加到购物车\`, 'success');
  }
  
  // 显示通知
  async showNotification(message, type = 'info') {
    const notifications = this.stateManager.getSharedState('notifications') || [];
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    notifications.push(notification);
    await this.stateManager.setSharedState('notifications', notifications);
    
    // 自动移除通知
    setTimeout(async () => {
      const currentNotifications = this.stateManager.getSharedState('notifications') || [];
      const updatedNotifications = currentNotifications.filter(
        n => n.id !== notification.id
      );
      await this.stateManager.setSharedState('notifications', updatedNotifications);
    }, 3000);
  }
  
  // 更新用户UI
  updateUserUI(user) {
    const userElement = document.getElementById('user-info');
    if (userElement) {
      if (user) {
        userElement.textContent = \`欢迎, \${user.name}\`;
      } else {
        userElement.textContent = '未登录';
      }
    }
  }
  
  // 更新主题
  updateTheme(theme) {
    document.body.className = document.body.className.replace(
      /theme-\\w+/g, ''
    ) + \` theme-\${theme}\`;
  }
}
\`\`\`

## 通信与状态管理最佳实践

### 1. 选择合适的通信方式

根据不同的场景选择合适的通信方式：

- **事件通信**：适合应用间的松耦合通知，如用户登录、主题切换等
- **共享状态**：适合需要频繁访问和更新的共享数据，如购物车、用户信息等
- **共享模块**：适合封装公共功能，如通知、日志、工具函数等
- **本地存储**：适合持久化少量数据，如用户偏好设置、主题等
- **iframe通信**：适合跨域场景下的应用通信

### 2. 设计清晰的接口

设计清晰、一致的通信接口，包括：

- **统一的数据格式**：定义统一的数据格式和命名规范
- **明确的错误处理**：提供明确的错误信息和处理机制
- **版本兼容性**：考虑接口的向后兼容性
- **文档说明**：提供详细的接口文档和使用示例

### 3. 实现安全机制

实现必要的安全机制，包括：

- **数据验证**：验证传入数据的格式和内容
- **权限控制**：根据应用权限限制数据访问
- **数据加密**：对敏感数据进行加密传输
- **防止XSS攻击**：对用户输入进行过滤和转义

### 4. 优化性能

优化通信和状态管理的性能：

- **减少通信频率**：合并多个小的更新为一次大的更新
- **使用缓存**：缓存频繁访问的数据
- **懒加载**：按需加载和初始化状态
- **批量更新**：批量处理状态更新，减少渲染次数

### 5. 实现调试工具

实现调试工具，方便开发调试：

- **日志记录**：记录所有通信和状态变化
- **状态查看器**：提供查看当前状态的工具
- **事件追踪**：追踪事件的触发和处理
- **性能监控**：监控通信和状态管理的性能

## 实际应用案例

### 电商网站微前端通信

假设我们有一个电商网站，采用微前端架构，包括产品应用、购物车应用、订单应用和用户应用。

#### 1. 通信架构设计

\`\`\`javascript
// 全局事件总线
const globalEventBus = new EventBus();

// 全局状态管理
const globalState = new CentralizedStateManager();

// 共享模块
const SharedModule = {
  // 用户管理
  user: {
    getCurrentUser: () => globalState.getState('user'),
    setCurrentUser: (user) => globalState.setState('user', user),
    isLoggedIn: () => !!globalState.getState('user')
  },
  
  // 购物车管理
  cart: {
    getCart: () => globalState.getState('cart'),
    addToCart: (product) => {
      const cart = globalState.getState('cart') || [];
      const existingItem = cart.find(item => item.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      
      globalState.setState('cart', cart);
      return cart;
    },
    removeFromCart: (productId) => {
      const cart = globalState.getState('cart') || [];
      const updatedCart = cart.filter(item => item.id !== productId);
      globalState.setState('cart', updatedCart);
      return updatedCart;
    },
    getItemCount: () => {
      const cart = globalState.getState('cart') || [];
      return cart.reduce((total, item) => total + item.quantity, 0);
    },
    getTotalPrice: () => {
      const cart = globalState.getState('cart') || [];
      return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
  },
  
  // 主题管理
  theme: {
    getCurrentTheme: () => globalState.getState('theme'),
    setTheme: (theme) => globalState.setState('theme', theme)
  },
  
  // 通知管理
  notification: {
    show: (message, type = 'info') => {
      globalEventBus.emit('notification:show', { message, type });
    }
  }
};
\`\`\`

#### 2. 产品应用实现

\`\`\`javascript
class ProductApp {
  constructor() {
    this.init();
  }
  
  init() {
    // 订阅用户状态变化
    globalState.subscribe('user', (user) => {
      this.updateUserUI(user);
    });
    
    // 订阅主题变化
    globalState.subscribe('theme', (theme) => {
      this.updateTheme(theme);
    });
    
    // 订阅通知事件
    globalEventBus.on('notification:show', (notification) => {
      this.showNotification(notification.message, notification.type);
    });
    
    // 加载产品数据
    this.loadProducts();
  }
  
  // 加载产品数据
  async loadProducts() {
    try {
      const products = await fetch('/api/products').then(res => res.json());
      this.renderProducts(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      SharedModule.notification.show('加载产品失败', 'error');
    }
  }
  
  // 渲染产品列表
  renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
      const productElement = document.createElement('div');
      productElement.className = 'product-card';
      productElement.innerHTML = \`
        <img src="\${product.image}" alt="\${product.name}" class="product-image">
        <h3 class="product-name">\${product.name}</h3>
        <p class="product-price">$\${product.price}</p>
        <button class="add-to-cart-btn" data-id="\${product.id}">添加到购物车</button>
      \`;
      
      // 添加到购物车按钮事件
      const addToCartBtn = productElement.querySelector('.add-to-cart-btn');
      addToCartBtn.addEventListener('click', () => {
        this.addToCart(product);
      });
      
      container.appendChild(productElement);
    });
  }
  
  // 添加到购物车
  addToCart(product) {
    // 检查用户是否登录
    if (!SharedModule.user.isLoggedIn()) {
      SharedModule.notification.show('请先登录', 'warning');
      return;
    }
    
    // 添加到购物车
    SharedModule.cart.addToCart(product);
    
    // 显示成功通知
    SharedModule.notification.show(\`\${product.name} 已添加到购物车\`, 'success');
    
    // 发布产品添加事件
    globalEventBus.emit('product:added-to-cart', { product });
  }
  
  // 更新用户UI
  updateUserUI(user) {
    const userElement = document.getElementById('user-info');
    if (userElement) {
      if (user) {
        userElement.textContent = \`欢迎, \${user.name}\`;
      } else {
        userElement.textContent = '未登录';
      }
    }
  }
  
  // 更新主题
  updateTheme(theme) {
    document.body.className = document.body.className.replace(
      /theme-\\w+/g, ''
    ) + \` theme-\${theme}\`;
  }
  
  // 显示通知
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 动画显示
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// 初始化产品应用
const productApp = new ProductApp();
\`\`\`

#### 3. 购物车应用实现

\`\`\`javascript
class CartApp {
  constructor() {
    this.init();
  }
  
  init() {
    // 订阅用户状态变化
    globalState.subscribe('user', (user) => {
      this.updateUserUI(user);
    });
    
    // 订阅主题变化
    globalState.subscribe('theme', (theme) => {
      this.updateTheme(theme);
    });
    
    // 订阅购物车变化
    globalState.subscribe('cart', (cart) => {
      this.updateCartUI(cart);
    });
    
    // 订阅产品添加事件
    globalEventBus.on('product:added-to-cart', (data) => {
      this.showProductAddedAnimation(data.product);
    });
    
    // 订阅通知事件
    globalEventBus.on('notification:show', (notification) => {
      this.showNotification(notification.message, notification.type);
    });
    
    // 初始化购物车UI
    this.updateCartUI(SharedModule.cart.getCart());
  }
  
  // 更新购物车UI
  updateCartUI(cart) {
    const cartElement = document.getElementById('cart-items');
    if (!cartElement) return;
    
    // 清空购物车
    cartElement.innerHTML = '';
    
    if (cart.length === 0) {
      cartElement.innerHTML = '<p class="empty-cart">购物车是空的</p>';
      this.updateCartSummary(0, 0);
      return;
    }
    
    // 添加购物车商品
    cart.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = \`
        <img src="\${item.image}" alt="\${item.name}" class="item-image">
        <div class="item-info">
          <h3 class="item-name">\${item.name}</h3>
          <p class="item-price">$\${item.price}</p>
          <div class="item-quantity">
            <button class="quantity-btn decrease" data-id="\${item.id}">-</button>
            <span class="quantity-value">\${item.quantity}</span>
            <button class="quantity-btn increase" data-id="\${item.id}">+</button>
          </div>
        </div>
        <div class="item-actions">
          <button class="remove-btn" data-id="\${item.id}">移除</button>
        </div>
      \`;
      
      // 添加数量减少按钮事件
      const decreaseBtn = itemElement.querySelector('.decrease');
      decreaseBtn.addEventListener('click', () => {
        this.decreaseQuantity(item.id);
      });
      
      // 添加数量增加按钮事件
      const increaseBtn = itemElement.querySelector('.increase');
      increaseBtn.addEventListener('click', () => {
        this.increaseQuantity(item.id);
      });
      
      // 添加移除按钮事件
      const removeBtn = itemElement.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        this.removeFromCart(item.id);
      });
      
      cartElement.appendChild(itemElement);
    });
    
    // 更新购物车摘要
    const itemCount = SharedModule.cart.getItemCount();
    const totalPrice = SharedModule.cart.getTotalPrice();
    this.updateCartSummary(itemCount, totalPrice);
  }
  
  // 更新购物车摘要
  updateCartSummary(itemCount, totalPrice) {
    const countElement = document.getElementById('cart-count');
    const totalElement = document.getElementById('cart-total');
    
    if (countElement) {
      countElement.textContent = itemCount;
    }
    
    if (totalElement) {
      totalElement.textContent = \`$\${totalPrice.toFixed(2)}\`;
    }
  }
  
  // 减少商品数量
  decreaseQuantity(productId) {
    const cart = SharedModule.cart.getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item && item.quantity > 1) {
      item.quantity -= 1;
      globalState.setState('cart', [...cart]);
    }
  }
  
  // 增加商品数量
  increaseQuantity(productId) {
    const cart = SharedModule.cart.getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
      item.quantity += 1;
      globalState.setState('cart', [...cart]);
    }
  }
  
  // 从购物车移除商品
  removeFromCart(productId) {
    SharedModule.cart.removeFromCart(productId);
    SharedModule.notification.show('商品已从购物车移除', 'info');
  }
  
  // 显示商品添加动画
  showProductAddedAnimation(product) {
    // 创建飞入购物车的动画效果
    const flyingImage = document.createElement('img');
    flyingImage.src = product.image;
    flyingImage.className = 'flying-product';
    flyingImage.style.position = 'fixed';
    flyingImage.style.width = '50px';
    flyingImage.style.height = '50px';
    flyingImage.style.zIndex = '1000';
    flyingImage.style.transition = 'all 0.8s ease-in-out';
    
    // 获取产品图片位置
    const productImage = document.querySelector(\`[data-id="\${product.id}"] img\`);
    if (productImage) {
      const rect = productImage.getBoundingClientRect();
      flyingImage.style.left = \`\${rect.left}px\`;
      flyingImage.style.top = \`\${rect.top}px\`;
    } else {
      flyingImage.style.left = '50%';
      flyingImage.style.top = '50%';
    }
    
    document.body.appendChild(flyingImage);
    
    // 获取购物车图标位置
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      
      // 触发动画
      setTimeout(() => {
        flyingImage.style.left = \`\${cartRect.left}px\`;
        flyingImage.style.top = \`\${cartRect.top}px\`;
        flyingImage.style.width = '20px';
        flyingImage.style.height = '20px';
        flyingImage.style.opacity = '0.5';
      }, 10);
      
      // 移除元素
      setTimeout(() => {
        if (flyingImage.parentNode) {
          flyingImage.parentNode.removeChild(flyingImage);
        }
      }, 800);
    }
  }
  
  // 更新用户UI
  updateUserUI(user) {
    const userElement = document.getElementById('user-info');
    if (userElement) {
      if (user) {
        userElement.textContent = \`欢迎, \${user.name}\`;
      } else {
        userElement.textContent = '未登录';
      }
    }
  }
  
  // 更新主题
  updateTheme(theme) {
    document.body.className = document.body.className.replace(
      /theme-\\w+/g, ''
    ) + \` theme-\${theme}\`;
  }
  
  // 显示通知
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 动画显示
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// 初始化购物车应用
const cartApp = new CartApp();
\`\`\`

## 总结

微前端应用间的状态管理是微前端架构中的核心问题，它决定了应用间的协作效率和系统的可维护性。本文详细介绍了三种状态管理策略：集中式状态管理、分布式状态管理和混合状态管理。

集中式状态管理适合核心共享数据，可以确保数据的一致性和可控性；分布式状态管理适合应用特定数据，可以提高应用的自治性和灵活性；混合状态管理结合了两者的优点，可以根据数据的特性和需求选择合适的管理方式。

无论选择哪种状态管理策略，都应该遵循松耦合、安全性、性能和可维护性的原则，设计清晰的接口，实现必要的安全机制，优化性能，并提供调试工具。

通过合理的状态管理设计，可以构建出高效、可靠、可维护的微前端系统，提高开发效率和用户体验。`;export{n as default};
//# sourceMappingURL=28-2-zg-GBWEY.js.map
