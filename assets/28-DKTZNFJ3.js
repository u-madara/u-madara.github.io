const n=`---
title: "微前端应用间通信与状态管理"
excerpt: "深入探讨微前端架构中应用间通信机制和状态管理方案，帮助开发者解决微前端应用间的数据共享和交互问题"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-11-22"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# 微前端应用间通信与状态管理

## 引言

在微前端架构中，应用间的通信与状态管理是一个核心且复杂的问题。由于微前端应用是独立开发、部署和运行的，它们之间需要一种安全、高效的机制来共享数据和协同工作。本文将深入探讨微前端应用间的通信方式、状态管理策略以及最佳实践，帮助开发者构建高效、可靠的微前端系统。

## 微前端通信概述

### 通信场景

在微前端架构中，常见的通信场景包括：

1. **数据共享**：不同应用之间共享用户信息、配置数据等
2. **状态同步**：一个应用的状态变化需要通知其他应用
3. **事件通知**：应用之间需要通知特定事件的发生
4. **服务调用**：一个应用需要调用另一个应用提供的服务
5. **路由协调**：应用之间需要协调路由跳转和导航

### 通信原则

在设计微前端通信机制时，应遵循以下原则：

1. **松耦合**：应用之间应尽量减少直接依赖，通过接口或事件进行通信
2. **安全性**：通信机制应防止恶意应用窃取或篡改数据
3. **性能**：通信机制应高效，避免不必要的性能开销
4. **可维护性**：通信逻辑应清晰、可维护，便于调试和扩展
5. **一致性**：通信机制应提供一致的数据格式和接口

## 通信方式详解

### 1. 基于事件的通信

事件驱动是微前端通信中最常见的方式，它通过发布-订阅模式实现应用间的解耦。

#### CustomEvent API

\`\`\`javascript
// 事件发布者
class EventPublisher {
  static publish(eventName, data, options = {}) {
    const event = new CustomEvent(eventName, {
      detail: data,
      bubbles: options.bubbles || false,
      cancelable: options.cancelable || false
    });
    
    window.dispatchEvent(event);
  }
}

// 事件订阅者
class EventSubscriber {
  static subscribe(eventName, handler, options = {}) {
    const eventHandler = (event) => {
      handler(event.detail, event);
    };
    
    window.addEventListener(eventName, eventHandler, options);
    
    // 返回取消订阅函数
    return () => {
      window.removeEventListener(eventName, eventHandler, options);
    };
  }
}

// 使用示例
// 在产品应用中发布产品选择事件
EventPublisher.publish('product:selected', {
  id: 'p123',
  name: 'Premium Widget',
  price: 99.99
});

// 在购物车应用中订阅产品选择事件
const unsubscribe = EventSubscriber.subscribe('product:selected', (product, event) => {
  console.log('Product selected:', product);
  // 将产品添加到购物车
  ShoppingCart.addItem(product);
});
\`\`\`

#### 增强的事件总线

\`\`\`javascript
// 增强的事件总线实现
class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
    this.middlewares = [];
  }

  // 添加中间件
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // 发布事件
  async emit(eventName, data, options = {}) {
    // 执行中间件
    let processedData = data;
    for (const middleware of this.middlewares) {
      processedData = await middleware(eventName, processedData, options);
    }

    // 处理普通事件
    if (this.events.has(eventName)) {
      const handlers = this.events.get(eventName);
      for (const handler of handlers) {
        try {
          await handler(processedData, eventName, options);
        } catch (error) {
          console.error(\`Error in event handler for \${eventName}:\`, error);
        }
      }
    }

    // 处理一次性事件
    if (this.onceEvents.has(eventName)) {
      const handlers = this.onceEvents.get(eventName);
      for (const handler of handlers) {
        try {
          await handler(processedData, eventName, options);
        } catch (error) {
          console.error(\`Error in once event handler for \${eventName}:\`, error);
        }
      }
      // 清除一次性事件处理器
      this.onceEvents.delete(eventName);
    }
  }

  // 订阅事件
  on(eventName, handler) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName).add(handler);

    // 返回取消订阅函数
    return () => {
      if (this.events.has(eventName)) {
        this.events.get(eventName).delete(handler);
        if (this.events.get(eventName).size === 0) {
          this.events.delete(eventName);
        }
      }
    };
  }

  // 订阅一次性事件
  once(eventName, handler) {
    if (!this.onceEvents.has(eventName)) {
      this.onceEvents.set(eventName, new Set());
    }
    this.onceEvents.get(eventName).add(handler);
  }

  // 取消订阅所有事件
  off() {
    this.events.clear();
    this.onceEvents.clear();
  }

  // 获取所有事件名
  eventNames() {
    return [...new Set([...this.events.keys(), ...this.onceEvents.keys()])];
  }

  // 获取事件的监听器数量
  listenerCount(eventName) {
    let count = 0;
    if (this.events.has(eventName)) {
      count += this.events.get(eventName).size;
    }
    if (this.onceEvents.has(eventName)) {
      count += this.onceEvents.get(eventName).size;
    }
    return count;
  }
}

// 创建全局事件总线
const globalEventBus = new EventBus();

// 添加日志中间件
globalEventBus.use((eventName, data, options) => {
  console.log(\`Event: \${eventName}\`, data);
  return data;
});

// 添加权限验证中间件
globalEventBus.use((eventName, data, options) => {
  // 验证事件权限
  if (eventName.startsWith('admin:') && !hasAdminPermission()) {
    throw new Error('Permission denied for admin event');
  }
  return data;
});

// 使用示例
// 订阅用户登录事件
const unsubscribeLogin = globalEventBus.on('user:login', (user) => {
  console.log('User logged in:', user);
  // 更新UI状态
  updateUserInterface(user);
});

// 发布用户登录事件
globalEventBus.emit('user:login', {
  id: 'u123',
  name: 'John Doe',
  email: 'john@example.com'
});

// 订阅一次性事件
globalEventBus.once('app:ready', () => {
  console.log('Application is ready');
  // 执行初始化操作
  initializeApplication();
});
\`\`\`

### 2. 基于共享状态的通信

共享状态是另一种常见的通信方式，它通过一个全局的状态存储来管理应用间的共享数据。

#### 简单的状态管理器

\`\`\`javascript
// 简单的状态管理器
class StateManager {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Map();
    this.middlewares = [];
  }

  // 添加中间件
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // 获取状态
  getState(key) {
    if (key === undefined) {
      return { ...this.state };
    }
    return this.state[key];
  }

  // 设置状态
  async setState(updates, options = {}) {
    // 执行中间件
    let processedUpdates = updates;
    for (const middleware of this.middlewares) {
      processedUpdates = await middleware(processedUpdates, this.state, options);
    }

    // 更新状态
    const prevState = { ...this.state };
    this.state = { ...this.state, ...processedUpdates };

    // 通知监听器
    for (const [key, listeners] of this.listeners.entries()) {
      if (key === '*' || processedUpdates.hasOwnProperty(key)) {
        for (const listener of listeners) {
          try {
            await listener(this.state[key], prevState[key], key);
          } catch (error) {
            console.error(\`Error in state listener for \${key}:\`, error);
          }
        }
      }
    }

    return this.state;
  }

  // 订阅状态变化
  subscribe(key, listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(listener);

    // 返回取消订阅函数
    return () => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).delete(listener);
        if (this.listeners.get(key).size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  // 重置状态
  reset(newState = {}) {
    this.state = newState;
  }
}

// 创建全局状态管理器
const globalState = new StateManager({
  user: null,
  cart: [],
  theme: 'light'
});

// 添加日志中间件
globalState.use(async (updates, prevState, options) => {
  console.log('State updates:', updates);
  return updates;
});

// 添加持久化中间件
globalState.use(async (updates, prevState, options) => {
  if (options.persist !== false) {
    localStorage.setItem('app-state', JSON.stringify({ ...prevState, ...updates }));
  }
  return updates;
});

// 使用示例
// 订阅用户状态变化
const unsubscribeUser = globalState.subscribe('user', (newUser, oldUser) => {
  console.log('User changed:', { newUser, oldUser });
  // 更新UI
  updateUserInterface(newUser);
});

// 设置用户状态
globalState.setState({
  user: {
    id: 'u123',
    name: 'John Doe',
    email: 'john@example.com'
  }
});

// 订阅所有状态变化
const unsubscribeAll = globalState.subscribe('*', (newValue, oldValue, key) => {
  console.log(\`State \${key} changed:\`, { newValue, oldValue });
});
\`\`\`

#### Redux风格的集中式状态管理

\`\`\`javascript
// Redux风格的集中式状态管理
class ReduxStyleStore {
  constructor(reducer, initialState = {}) {
    this.state = initialState;
    this.reducer = reducer;
    this.listeners = [];
    this.middlewares = [];
  }

  // 添加中间件
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // 获取当前状态
  getState() {
    return this.state;
  }

  // 分发动作
  async dispatch(action) {
    // 执行中间件
    let processedAction = action;
    for (const middleware of this.middlewares) {
      processedAction = await middleware(processedAction, this.state);
    }

    // 执行reducer更新状态
    const prevState = this.state;
    this.state = this.reducer(this.state, processedAction);

    // 通知监听器
    for (const listener of this.listeners) {
      try {
        await listener(this.state, prevState, processedAction);
      } catch (error) {
        console.error('Error in store listener:', error);
      }
    }

    return processedAction;
  }

  // 订阅状态变化
  subscribe(listener) {
    this.listeners.push(listener);

    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// 定义action类型
const ActionTypes = {
  SET_USER: 'SET_USER',
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  SET_THEME: 'SET_THEME'
};

// 定义action创建器
const ActionCreators = {
  setUser: (user) => ({ type: ActionTypes.SET_USER, payload: user }),
  addToCart: (product) => ({ type: ActionTypes.ADD_TO_CART, payload: product }),
  removeFromCart: (productId) => ({ type: ActionTypes.REMOVE_FROM_CART, payload: productId }),
  setTheme: (theme) => ({ type: ActionTypes.SET_THEME, payload: theme })
};

// 定义reducer
function appReducer(state = {
  user: null,
  cart: [],
  theme: 'light'
}, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload };
    case ActionTypes.ADD_TO_CART:
      return { 
        ...state, 
        cart: [...state.cart, { ...action.payload, id: Date.now().toString() }] 
      };
    case ActionTypes.REMOVE_FROM_CART:
      return { 
        ...state, 
        cart: state.cart.filter(item => item.id !== action.payload) 
      };
    case ActionTypes.SET_THEME:
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

// 创建store
const store = new ReduxStyleStore(appReducer);

// 添加日志中间件
store.use(async (action, state) => {
  console.log('Action:', action);
  console.log('Current state:', state);
  return action;
});

// 添加持久化中间件
store.use(async (action, state) => {
  // 在这里可以实现状态持久化逻辑
  return action;
});

// 使用示例
// 订阅状态变化
const unsubscribe = store.subscribe((newState, prevState, action) => {
  console.log('State changed:', { newState, prevState, action });
  // 更新UI
  updateUI(newState);
});

// 分发动作
store.dispatch(ActionCreators.setUser({
  id: 'u123',
  name: 'John Doe',
  email: 'john@example.com'
}));

store.dispatch(ActionCreators.addToCart({
  id: 'p123',
  name: 'Premium Widget',
  price: 99.99
}));
\`\`\`

### 3. 基于共享模块的通信

共享模块是一种将公共功能封装成独立模块，供多个微前端应用共享使用的方式。

#### 共享模块定义

\`\`\`javascript
// shared-module.js
export const SharedModule = {
  // 用户管理
  user: {
    // 获取当前用户
    getCurrentUser() {
      return window.sharedState?.user || null;
    },
    
    // 设置当前用户
    setCurrentUser(user) {
      if (!window.sharedState) {
        window.sharedState = {};
      }
      window.sharedState.user = user;
      
      // 触发用户变化事件
      window.dispatchEvent(new CustomEvent('user:changed', { detail: user }));
    },
    
    // 检查用户是否已登录
    isLoggedIn() {
      return !!this.getCurrentUser();
    }
  },
  
  // 购物车管理
  cart: {
    // 获取购物车
    getCart() {
      return window.sharedState?.cart || [];
    },
    
    // 添加商品到购物车
    addToCart(product) {
      if (!window.sharedState) {
        window.sharedState = {};
      }
      if (!window.sharedState.cart) {
        window.sharedState.cart = [];
      }
      
      // 检查商品是否已在购物车中
      const existingItem = window.sharedState.cart.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += product.quantity || 1;
      } else {
        window.sharedState.cart.push({ ...product, quantity: product.quantity || 1 });
      }
      
      // 触发购物车变化事件
      window.dispatchEvent(new CustomEvent('cart:changed', { 
        detail: window.sharedState.cart 
      }));
    },
    
    // 从购物车移除商品
    removeFromCart(productId) {
      if (!window.sharedState?.cart) return;
      
      window.sharedState.cart = window.sharedState.cart.filter(
        item => item.id !== productId
      );
      
      // 触发购物车变化事件
      window.dispatchEvent(new CustomEvent('cart:changed', { 
        detail: window.sharedState.cart 
      }));
    },
    
    // 获取购物车商品总数
    getItemCount() {
      return this.getCart().reduce((total, item) => total + item.quantity, 0);
    },
    
    // 获取购物车总价
    getTotalPrice() {
      return this.getCart().reduce(
        (total, item) => total + (item.price * item.quantity), 
        0
      );
    }
  },
  
  // 主题管理
  theme: {
    // 获取当前主题
    getCurrentTheme() {
      return window.sharedState?.theme || 'light';
    },
    
    // 设置主题
    setTheme(theme) {
      if (!window.sharedState) {
        window.sharedState = {};
      }
      window.sharedState.theme = theme;
      
      // 更新DOM
      document.body.className = document.body.className.replace(
        /theme-\\w+/g, 
        ''
      ) + \` theme-\${theme}\`;
      
      // 触发主题变化事件
      window.dispatchEvent(new CustomEvent('theme:changed', { detail: theme }));
    }
  },
  
  // 通知管理
  notification: {
    // 显示通知
    show(message, type = 'info', duration = 3000) {
      const notification = document.createElement('div');
      notification.className = \`notification notification-\${type}\`;
      notification.textContent = message;
      
      // 添加到页面
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
      }, duration);
      
      // 触发通知事件
      window.dispatchEvent(new CustomEvent('notification:show', { 
        detail: { message, type, duration } 
      }));
    }
  }
};

// 初始化共享模块
if (typeof window !== 'undefined') {
  window.SharedModule = SharedModule;
}
\`\`\`

#### 在微前端应用中使用共享模块

\`\`\`javascript
// 在产品应用中使用共享模块
import { SharedModule } from './shared-module';

class ProductApp {
  constructor() {
    this.init();
  }
  
  init() {
    // 监听用户变化
    window.addEventListener('user:changed', (event) => {
      this.updateUserUI(event.detail);
    });
    
    // 监听主题变化
    window.addEventListener('theme:changed', (event) => {
      this.updateTheme(event.detail);
    });
  }
  
  // 添加商品到购物车
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
    // 应用主题样式
    this.applyThemeStyles(theme);
  }
  
  // 应用主题样式
  applyThemeStyles(theme) {
    // 根据主题更新样式
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--primary-color', '#1890ff');
      root.style.setProperty('--background-color', '#141414');
      root.style.setProperty('--text-color', '#ffffff');
    } else {
      root.style.setProperty('--primary-color', '#1890ff');
      root.style.setProperty('--background-color', '#ffffff');
      root.style.setProperty('--text-color', '#000000');
    }
  }
}

// 在购物车应用中使用共享模块
import { SharedModule } from './shared-module';

class CartApp {
  constructor() {
    this.init();
  }
  
  init() {
    // 监听购物车变化
    window.addEventListener('cart:changed', (event) => {
      this.updateCartUI(event.detail);
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
        SharedModule.cart.removeFromCart(item.id);
      });
      
      cartElement.appendChild(itemElement);
    });
    
    // 更新总价
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
      totalElement.textContent = \`总价: $\${SharedModule.cart.getTotalPrice()}\`;
    }
    
    // 更新商品数量
    const countElement = document.getElementById('cart-count');
    if (countElement) {
      countElement.textContent = SharedModule.cart.getItemCount();
    }
  }
}
\`\`\`

### 4. 基于本地存储的通信

本地存储（LocalStorage、SessionStorage）是一种简单但有效的跨应用通信方式，特别适合存储少量共享数据。

#### 本地存储封装

\`\`\`javascript
// 本地存储封装
class StorageManager {
  constructor(storage = localStorage) {
    this.storage = storage;
    this.listeners = new Map();
    this.prefix = 'micro-app-';
    
    // 监听storage事件
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith(this.prefix)) {
        const key = event.key.substring(this.prefix.length);
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null;
        
        this.notifyListeners(key, newValue, oldValue);
      }
    });
  }
  
  // 设置值
  set(key, value) {
    const serializedValue = JSON.stringify(value);
    const storageKey = this.prefix + key;
    
    try {
      this.storage.setItem(storageKey, serializedValue);
      
      // 触发本地事件（同一页面内）
      const oldValue = this.get(key);
      this.notifyListeners(key, value, oldValue);
      
      return true;
    } catch (error) {
      console.error('Error setting storage value:', error);
      return false;
    }
  }
  
  // 获取值
  get(key) {
    const storageKey = this.prefix + key;
    
    try {
      const value = this.storage.getItem(storageKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting storage value:', error);
      return null;
    }
  }
  
  // 删除值
  remove(key) {
    const storageKey = this.prefix + key;
    
    try {
      const oldValue = this.get(key);
      this.storage.removeItem(storageKey);
      
      // 触发本地事件（同一页面内）
      this.notifyListeners(key, null, oldValue);
      
      return true;
    } catch (error) {
      console.error('Error removing storage value:', error);
      return false;
    }
  }
  
  // 清空所有值
  clear() {
    try {
      const keysToRemove = [];
      
      // 收集所有带前缀的键
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      // 删除所有带前缀的键
      keysToRemove.forEach(key => {
        this.storage.removeItem(key);
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
  
  // 订阅变化
  subscribe(key, listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(listener);
    
    // 返回取消订阅函数
    return () => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).delete(listener);
        if (this.listeners.get(key).size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }
  
  // 通知监听器
  notifyListeners(key, newValue, oldValue) {
    if (this.listeners.has(key)) {
      for (const listener of this.listeners.get(key)) {
        try {
          listener(newValue, oldValue, key);
        } catch (error) {
          console.error(\`Error in storage listener for \${key}:\`, error);
        }
      }
    }
  }
}

// 创建全局存储管理器
const globalStorage = new StorageManager();

// 使用示例
// 订阅用户数据变化
const unsubscribeUser = globalStorage.subscribe('user', (newUser, oldUser) => {
  console.log('User changed:', { newUser, oldUser });
  // 更新UI
  updateUserInterface(newUser);
});

// 设置用户数据
globalStorage.set('user', {
  id: 'u123',
  name: 'John Doe',
  email: 'john@example.com'
});

// 获取用户数据
const user = globalStorage.get('user');
console.log('Current user:', user);

// 删除用户数据
globalStorage.remove('user');
\`\`\`

### 5. 基于iframe的通信

iframe是一种传统的跨域通信方式，通过postMessage API实现不同iframe之间的通信。

#### iframe通信封装

\`\`\`javascript
// iframe通信封装
class IframeCommunicator {
  constructor(options = {}) {
    this.targetOrigin = options.targetOrigin || '*';
    this.messageHandlers = new Map();
    this.pendingRequests = new Map();
    this.requestId = 0;
    
    // 监听消息
    window.addEventListener('message', this.handleMessage.bind(this));
  }
  
  // 发送消息
  send(targetWindow, type, data, options = {}) {
    const message = {
      id: this.generateRequestId(),
      type,
      data,
      timestamp: Date.now(),
      source: window.location.origin
    };
    
    // 如果需要响应，添加到待处理请求
    if (options.expectResponse) {
      this.pendingRequests.set(message.id, {
        resolve: options.resolve,
        reject: options.reject,
        timeout: options.timeout || 5000
      });
      
      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests.has(message.id)) {
          const request = this.pendingRequests.get(message.id);
          this.pendingRequests.delete(message.id);
          request.reject(new Error('Request timeout'));
        }
      }, request.timeout);
    }
    
    // 发送消息
    targetWindow.postMessage(message, options.targetOrigin || this.targetOrigin);
    
    return message.id;
  }
  
  // 发送请求并等待响应
  request(targetWindow, type, data, options = {}) {
    return new Promise((resolve, reject) => {
      this.send(targetWindow, type, data, {
        ...options,
        expectResponse: true,
        resolve,
        reject
      });
    });
  }
  
  // 注册消息处理器
  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type).add(handler);
    
    // 返回取消注册函数
    return () => {
      if (this.messageHandlers.has(type)) {
        this.messageHandlers.get(type).delete(handler);
        if (this.messageHandlers.get(type).size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }
  
  // 处理接收到的消息
  async handleMessage(event) {
    // 验证来源
    if (event.origin !== window.location.origin && this.targetOrigin !== '*') {
      return;
    }
    
    const { id, type, data, responseTo, error } = event.data;
    
    // 处理响应
    if (responseTo) {
      const request = this.pendingRequests.get(responseTo);
      if (request) {
        this.pendingRequests.delete(responseTo);
        
        if (error) {
          request.reject(new Error(error));
        } else {
          request.resolve(data);
        }
      }
      return;
    }
    
    // 处理请求
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      
      for (const handler of handlers) {
        try {
          const result = await handler(data, event);
          
          // 如果有请求ID，发送响应
          if (id) {
            event.source.postMessage({
              responseTo: id,
              data: result,
              source: window.location.origin
            }, event.origin);
          }
        } catch (error) {
          console.error(\`Error in message handler for \${type}:\`, error);
          
          // 发送错误响应
          if (id) {
            event.source.postMessage({
              responseTo: id,
              error: error.message,
              source: window.location.origin
            }, event.origin);
          }
        }
      }
    }
  }
  
  // 生成请求ID
  generateRequestId() {
    return \`req_\${++this.requestId}_\${Date.now()}\`;
  }
}

// 创建全局通信器
const globalCommunicator = new IframeCommunicator({
  targetOrigin: 'http://localhost:3000' // 指定允许的源
});

// 在主应用中注册消息处理器
globalCommunicator.on('get-user', () => {
  return globalStorage.get('user');
});

globalCommunicator.on('set-user', (user) => {
  globalStorage.set('user', user);
  return { success: true };
});

globalCommunicator.on('add-to-cart', (product) => {
  SharedModule.cart.addToCart(product);
  return { success: true };
});

// 在微前端应用中使用通信器
class MicroApp {
  constructor() {
    this.parentWindow = window.parent;
    this.communicator = new IframeCommunicator();
  }
  
  // 获取用户信息
  async getUser() {
    try {
      return await this.communicator.request(this.parentWindow, 'get-user');
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }
  
  // 设置用户信息
  async setUser(user) {
    try {
      return await this.communicator.request(this.parentWindow, 'set-user', user);
    } catch (error) {
      console.error('Failed to set user:', error);
      return { success: false };
    }
  }
  
  // 添加商品到购物车
  async addToCart(product) {
    try {
      return await this.communicator.request(this.parentWindow, 'add-to-cart', product);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return { success: false };
    }
  }
}
\`\`\`

## 状态管理策略

在微前端架构中，状态管理需要考虑应用间的数据共享、同步和隔离。以下是几种常见的状态管理策略：

### 1. 集中式状态管理

集中式状态管理将所有共享状态集中在一个地方管理，通常由主应用负责。

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

分布式状态管理允许每个微前端应用管理自己的状态，同时提供机制与其他应用共享必要的状态。

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

微前端应用间的通信与状态管理是微前端架构中的核心问题，它决定了应用间的协作效率和系统的可维护性。本文详细介绍了多种通信方式和状态管理策略，包括基于事件的通信、共享状态管理、共享模块、本地存储和iframe通信等。

在选择通信方式时，需要根据具体场景和需求进行权衡。事件通信适合松耦合的通知场景，共享状态适合需要频繁访问的数据，共享模块适合封装公共功能，本地存储适合持久化少量数据，iframe通信适合跨域场景。

状态管理策略方面，集中式状态管理适合核心共享数据，分布式状态管理适合应用特定数据，混合状态管理结合了两者的优点。

无论选择哪种方式，都应该遵循松耦合、安全性、性能和可维护性的原则，设计清晰的接口，实现必要的安全机制，优化性能，并提供调试工具。

通过合理的通信与状态管理设计，可以构建出高效、可靠、可维护的微前端系统，提高开发效率和用户体验。`;export{n as default};
//# sourceMappingURL=28-DKTZNFJ3.js.map
