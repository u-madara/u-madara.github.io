const n=`---
title: "JavaScript性能优化实战案例"
excerpt: "通过实际案例展示JavaScript性能优化技术的应用，包括大型应用优化、移动端性能优化和特定场景的性能优化策略"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-09-03"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
categories: ["JavaScript"]
---

# JavaScript性能优化实战案例

## 引言

在之前的文章中，我们探讨了JavaScript内存管理、性能优化技巧、高级优化技术和性能监控方法。本文将通过实际案例展示如何应用这些技术解决真实场景中的性能问题，包括大型应用优化、移动端性能优化和特定场景的性能优化策略。

## 6. 性能优化实战案例

### 6.1 大型应用性能优化

\`\`\`javascript
// 1. 模块懒加载优化
class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.moduleRegistry = new Map();
  }
  
  // 注册模块
  register(name, moduleFactory) {
    this.moduleRegistry.set(name, moduleFactory);
  }
  
  // 加载模块
  async load(name) {
    // 如果模块已加载，直接返回
    if (this.loadedModules.has(name)) {
      return this.loadedModules.get(name);
    }
    
    // 如果模块正在加载，返回加载Promise
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }
    
    // 创建加载Promise
    const loadingPromise = this.loadModule(name);
    this.loadingPromises.set(name, loadingPromise);
    
    try {
      const module = await loadingPromise;
      this.loadedModules.set(name, module);
      return module;
    } finally {
      this.loadingPromises.delete(name);
    }
  }
  
  // 实际加载模块
  async loadModule(name) {
    const moduleFactory = this.moduleRegistry.get(name);
    
    if (!moduleFactory) {
      throw new Error(\`Module "\${name}" not found\`);
    }
    
    // 使用动态导入加载模块
    if (typeof moduleFactory === 'string') {
      const module = await import(moduleFactory);
      return module.default || module;
    }
    
    // 使用工厂函数创建模块
    if (typeof moduleFactory === 'function') {
      return moduleFactory();
    }
    
    return moduleFactory;
  }
  
  // 预加载模块
  async preload(names) {
    const promises = names.map(name => this.load(name));
    return Promise.all(promises);
  }
  
  // 卸载模块
  unload(name) {
    this.loadedModules.delete(name);
    
    // 如果模块有清理方法，调用它
    const module = this.loadedModules.get(name);
    if (module && typeof module.cleanup === 'function') {
      module.cleanup();
    }
  }
}

// 使用模块加载器
const moduleLoader = new ModuleLoader();

// 注册模块
moduleLoader.register('dashboard', () => import('./modules/dashboard.js'));
moduleLoader.register('analytics', () => import('./modules/analytics.js'));
moduleLoader.register('reports', () => import('./modules/reports.js'));

// 路由变化时加载对应模块
async function handleRouteChange(route) {
  const module = await moduleLoader.load(route);
  module.init();
}

// 预加载关键模块
moduleLoader.preload(['dashboard', 'analytics']);

// 2. 数据分页与虚拟列表优化
class VirtualList {
  constructor(container, options = {}) {
    this.container = container;
    this.itemHeight = options.itemHeight || 50;
    this.bufferSize = options.bufferSize || 5;
    this.data = [];
    this.visibleItems = [];
    this.renderItem = options.renderItem || this.defaultRenderItem;
    this.onScroll = options.onScroll || (() => {});
    
    this.init();
  }
  
  init() {
    // 创建滚动容器
    this.scroller = document.createElement('div');
    this.scroller.style.height = '100%';
    this.scroller.style.overflow = 'auto';
    this.scroller.style.position = 'relative';
    
    // 创建内容容器
    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    
    this.scroller.appendChild(this.content);
    this.container.appendChild(this.scroller);
    
    // 添加滚动事件监听
    this.scroller.addEventListener('scroll', this.handleScroll.bind(this));
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  // 设置数据
  setData(data) {
    this.data = data;
    this.updateContentHeight();
    this.updateVisibleItems();
  }
  
  // 更新内容高度
  updateContentHeight() {
    this.content.style.height = \`\${this.data.length * this.itemHeight}px\`;
  }
  
  // 处理滚动事件
  handleScroll() {
    this.updateVisibleItems();
    this.onScroll(this.getScrollInfo());
  }
  
  // 处理窗口大小变化
  handleResize() {
    this.updateVisibleItems();
  }
  
  // 更新可见项
  updateVisibleItems() {
    const scrollTop = this.scroller.scrollTop;
    const containerHeight = this.scroller.clientHeight;
    
    // 计算可见范围
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize);
    const endIndex = Math.min(
      this.data.length - 1,
      Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.bufferSize
    );
    
    // 清理不可见的元素
    this.visibleItems.forEach(item => {
      if (item.index < startIndex || item.index > endIndex) {
        if (item.element.parentNode) {
          item.element.remove();
        }
      }
    });
    
    // 过滤出仍然可见的元素
    this.visibleItems = this.visibleItems.filter(item => 
      item.index >= startIndex && item.index <= endIndex
    );
    
    // 创建或更新可见元素
    for (let i = startIndex; i <= endIndex; i++) {
      const existingItem = this.visibleItems.find(item => item.index === i);
      
      if (!existingItem) {
        const element = this.renderItem(this.data[i], i);
        element.style.position = 'absolute';
        element.style.top = \`\${i * this.itemHeight}px\`;
        element.style.height = \`\${this.itemHeight}px\`;
        element.style.width = '100%';
        
        this.content.appendChild(element);
        this.visibleItems.push({ index: i, element });
      }
    }
  }
  
  // 默认渲染函数
  defaultRenderItem(item, index) {
    const element = document.createElement('div');
    element.textContent = \`Item \${index}: \${JSON.stringify(item)}\`;
    return element;
  }
  
  // 获取滚动信息
  getScrollInfo() {
    const scrollTop = this.scroller.scrollTop;
    const containerHeight = this.scroller.clientHeight;
    const contentHeight = this.content.clientHeight;
    
    return {
      scrollTop,
      containerHeight,
      contentHeight,
      scrollPercentage: scrollTop / (contentHeight - containerHeight),
      isAtTop: scrollTop === 0,
      isAtBottom: scrollTop + containerHeight >= contentHeight
    };
  }
  
  // 滚动到指定项
  scrollToItem(index, alignment = 'start') {
    if (index < 0 || index >= this.data.length) {
      return;
    }
    
    let scrollTop;
    
    switch (alignment) {
      case 'start':
        scrollTop = index * this.itemHeight;
        break;
      case 'center':
        scrollTop = index * this.itemHeight - this.scroller.clientHeight / 2 + this.itemHeight / 2;
        break;
      case 'end':
        scrollTop = index * this.itemHeight - this.scroller.clientHeight + this.itemHeight;
        break;
    }
    
    this.scroller.scrollTop = Math.max(0, scrollTop);
  }
  
  // 销毁虚拟列表
  destroy() {
    this.scroller.removeEventListener('scroll', this.handleScroll.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.container.removeChild(this.scroller);
  }
}

// 3. 状态管理优化
class OptimizedStateManager {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = new Map();
    this.middleware = [];
    this.batchedUpdates = [];
    this.isBatchingUpdates = false;
    this.updateTimeout = null;
  }
  
  // 添加中间件
  use(middleware) {
    this.middleware.push(middleware);
  }
  
  // 获取状态
  getState(path) {
    if (!path) return this.state;
    
    return path.split('.').reduce((obj, key) => obj && obj[key], this.state);
  }
  
  // 订阅状态变化
  subscribe(path, listener) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    
    this.listeners.get(path).add(listener);
    
    // 返回取消订阅函数
    return () => {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        pathListeners.delete(listener);
        
        if (pathListeners.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }
  
  // 更新状态
  setState(updates, isBatch = false) {
    if (isBatch) {
      this.batchedUpdates.push(updates);
      
      if (!this.isBatchingUpdates) {
        this.isBatchingUpdates = true;
        
        // 延迟执行批量更新
        this.updateTimeout = setTimeout(() => {
          this.flushBatchedUpdates();
        }, 0);
      }
    } else {
      this.performUpdate(updates);
    }
  }
  
  // 执行更新
  performUpdate(updates) {
    const prevState = { ...this.state };
    let nextState = { ...this.state };
    
    // 应用更新
    if (typeof updates === 'function') {
      nextState = updates(nextState);
    } else {
      nextState = { ...nextState, ...updates };
    }
    
    // 应用中间件
    for (const middleware of this.middleware) {
      nextState = middleware(nextState, prevState);
    }
    
    // 检查状态是否实际发生变化
    const changedPaths = this.getChangedPaths(prevState, nextState);
    
    if (changedPaths.length === 0) {
      return;
    }
    
    this.state = nextState;
    
    // 通知监听器
    this.notifyListeners(changedPaths);
  }
  
  // 刷新批量更新
  flushBatchedUpdates() {
    if (this.batchedUpdates.length === 0) {
      this.isBatchingUpdates = false;
      return;
    }
    
    const updates = this.batchedUpdates;
    this.batchedUpdates = [];
    this.isBatchingUpdates = false;
    
    // 合并所有更新
    let mergedUpdates = {};
    
    for (const update of updates) {
      if (typeof update === 'function') {
        mergedUpdates = update(mergedUpdates);
      } else {
        mergedUpdates = { ...mergedUpdates, ...update };
      }
    }
    
    this.performUpdate(mergedUpdates);
  }
  
  // 获取变化的路径
  getChangedPaths(prevState, nextState) {
    const changedPaths = [];
    
    // 检查顶层属性
    for (const key in nextState) {
      if (nextState[key] !== prevState[key]) {
        changedPaths.push(key);
        
        // 检查嵌套属性
        const nestedPaths = this.getNestedChangedPaths(
          \`\${key}\`,
          prevState[key],
          nextState[key]
        );
        
        changedPaths.push(...nestedPaths);
      }
    }
    
    // 检查删除的属性
    for (const key in prevState) {
      if (!(key in nextState)) {
        changedPaths.push(key);
      }
    }
    
    return changedPaths;
  }
  
  // 获取嵌套变化的路径
  getNestedChangedPaths(basePath, prevValue, nextValue) {
    const changedPaths = [];
    
    if (
      typeof prevValue === 'object' &&
      prevValue !== null &&
      typeof nextValue === 'object' &&
      nextValue !== null &&
      !Array.isArray(prevValue) &&
      !Array.isArray(nextValue)
    ) {
      for (const key in nextValue) {
        if (nextValue[key] !== prevValue[key]) {
          const nestedPath = \`\${basePath}.\${key}\`;
          changedPaths.push(nestedPath);
          
          // 递归检查更深层的嵌套
          const deeperPaths = this.getNestedChangedPaths(
            nestedPath,
            prevValue[key],
            nextValue[key]
          );
          
          changedPaths.push(...deeperPaths);
        }
      }
      
      for (const key in prevValue) {
        if (!(key in nextValue)) {
          changedPaths.push(\`\${basePath}.\${key}\`);
        }
      }
    }
    
    return changedPaths;
  }
  
  // 通知监听器
  notifyListeners(changedPaths) {
    for (const path of changedPaths) {
      const pathListeners = this.listeners.get(path);
      
      if (pathListeners) {
        for (const listener of pathListeners) {
          listener(this.getState(path), path);
        }
      }
      
      // 通知通配符监听器
      const wildcardListeners = this.listeners.get('*');
      if (wildcardListeners) {
        for (const listener of wildcardListeners) {
          listener(this.getState(path), path);
        }
      }
    }
  }
  
  // 批量更新
  batchUpdate(updates) {
    this.setState(updates, true);
  }
}
\`\`\`

### 6.2 移动端性能优化

\`\`\`javascript
// 1. 触摸事件优化
class TouchOptimizer {
  constructor(element) {
    this.element = element;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isScrolling = false;
    this.isSwiping = false;
    this.threshold = 10; // 滑动阈值
    this.timeThreshold = 300; // 时间阈值
    
    this.init();
  }
  
  init() {
    // 使用passive事件监听器提高滚动性能
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    
    // 防止默认的触摸行为
    this.element.addEventListener('touchmove', this.preventDefault, { passive: false });
  }
  
  handleTouchStart(event) {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.isScrolling = false;
    this.isSwiping = false;
  }
  
  handleTouchMove(event) {
    if (this.isScrolling) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    
    // 判断是否为滑动
    if (Math.abs(deltaX) > this.threshold || Math.abs(deltaY) > this.threshold) {
      this.isSwiping = true;
      
      // 判断滑动方向
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (isHorizontal) {
        // 水平滑动，阻止默认滚动行为
        event.preventDefault();
      } else {
        // 垂直滑动，允许滚动
        this.isScrolling = true;
      }
    }
  }
  
  handleTouchEnd(event) {
    const touchEndTime = Date.now();
    const deltaTime = touchEndTime - this.touchStartTime;
    
    // 如果是快速滑动
    if (this.isSwiping && deltaTime < this.timeThreshold) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      
      // 触发滑动事件
      this.triggerSwipeEvent(deltaX, deltaY);
    }
  }
  
  preventDefault(event) {
    if (this.isSwiping) {
      event.preventDefault();
    }
  }
  
  triggerSwipeEvent(deltaX, deltaY) {
    let direction;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    const swipeEvent = new CustomEvent('swipe', {
      detail: { direction, deltaX, deltaY }
    });
    
    this.element.dispatchEvent(swipeEvent);
  }
  
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchmove', this.preventDefault);
  }
}

// 2. 图片懒加载优化
class ImageLazyLoader {
  constructor(options = {}) {
    this.options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
      placeholder: options.placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
      ...options
    };
    
    this.observer = null;
    this.loadedImages = new WeakSet();
    
    this.init();
  }
  
  init() {
    // 创建交叉观察器
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        root: this.options.root,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      }
    );
    
    // 查找所有需要懒加载的图片
    this.observeImages();
  }
  
  observeImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    images.forEach(img => {
      // 设置占位图
      if (!img.src) {
        img.src = this.options.placeholder;
      }
      
      // 添加加载状态类
      img.classList.add('lazy-loading');
      
      // 开始观察
      this.observer.observe(img);
    });
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // 如果图片已经加载过，跳过
        if (this.loadedImages.has(img)) {
          this.observer.unobserve(img);
          return;
        }
        
        // 加载图片
        this.loadImage(img);
      }
    });
  }
  
  loadImage(img) {
    const src = img.dataset.src;
    
    if (!src) return;
    
    // 创建新图片对象预加载
    const tempImg = new Image();
    
    tempImg.onload = () => {
      // 图片加载成功
      img.src = src;
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');
      
      // 标记为已加载
      this.loadedImages.add(img);
      
      // 停止观察
      this.observer.unobserve(img);
      
      // 触发加载完成事件
      img.dispatchEvent(new CustomEvent('lazyload', { detail: img }));
    };
    
    tempImg.onerror = () => {
      // 图片加载失败
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');
      
      // 停止观察
      this.observer.unobserve(img);
      
      // 触发加载失败事件
      img.dispatchEvent(new CustomEvent('lazyerror', { detail: img }));
    };
    
    // 开始加载
    tempImg.src = src;
  }
  
  // 添加新图片到观察列表
  addImage(img) {
    if (!img.src && img.dataset.src) {
      img.src = this.options.placeholder;
      img.classList.add('lazy-loading');
      this.observer.observe(img);
    }
  }
  
  // 手动触发加载
  loadImageNow(img) {
    if (img.dataset.src && !this.loadedImages.has(img)) {
      this.loadImage(img);
    }
  }
  
  // 销毁懒加载器
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// 3. 动画性能优化
class MobileAnimationOptimizer {
  constructor() {
    this.animationFrames = new Map();
    this.isReducedMotion = this.checkReducedMotion();
    this.isLowEndDevice = this.checkLowEndDevice();
  }
  
  // 检查是否启用了减少动画
  checkReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  // 检查是否为低端设备
  checkLowEndDevice() {
    // 简单的检测方法，实际应用中可能需要更复杂的逻辑
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const deviceMemory = navigator.deviceMemory || 4;
    
    return hardwareConcurrency <= 4 || deviceMemory <= 4;
  }
  
  // 优化的动画函数
  animate(element, keyframes, options = {}) {
    // 如果启用了减少动画，直接应用最终状态
    if (this.isReducedMotion) {
      this.applyFinalState(element, keyframes);
      return null;
    }
    
    // 如果是低端设备，降低动画质量
    if (this.isLowEndDevice) {
      options = this.optimizeOptionsForLowEnd(options);
    }
    
    // 创建动画
    const animation = element.animate(keyframes, options);
    
    // 存储动画引用
    const animationId = this.generateAnimationId();
    this.animationFrames.set(animationId, animation);
    
    // 动画结束时清理
    animation.onfinish = () => {
      this.animationFrames.delete(animationId);
    };
    
    return animationId;
  }
  
  // 应用最终状态
  applyFinalState(element, keyframes) {
    if (!keyframes || keyframes.length === 0) return;
    
    const finalFrame = keyframes[keyframes.length - 1];
    
    for (const property in finalFrame) {
      element.style[property] = finalFrame[property];
    }
  }
  
  // 为低端设备优化选项
  optimizeOptionsForLowEnd(options) {
    const optimizedOptions = { ...options };
    
    // 缩短动画时间
    if (optimizedOptions.duration) {
      optimizedOptions.duration = Math.min(optimizedOptions.duration, 300);
    }
    
    // 禁用缓动函数
    if (!optimizedOptions.easing) {
      optimizedOptions.easing = 'linear';
    }
    
    return optimizedOptions;
  }
  
  // 生成动画ID
  generateAnimationId() {
    return \`anim_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  }
  
  // 取消动画
  cancel(animationId) {
    const animation = this.animationFrames.get(animationId);
    
    if (animation) {
      animation.cancel();
      this.animationFrames.delete(animationId);
    }
  }
  
  // 暂停动画
  pause(animationId) {
    const animation = this.animationFrames.get(animationId);
    
    if (animation) {
      animation.pause();
    }
  }
  
  // 恢复动画
  play(animationId) {
    const animation = this.animationFrames.get(animationId);
    
    if (animation) {
      animation.play();
    }
  }
  
  // 取消所有动画
  cancelAll() {
    for (const [id, animation] of this.animationFrames) {
      animation.cancel();
    }
    
    this.animationFrames.clear();
  }
}
\`\`\`

## 结论

通过本文的实战案例，我们展示了如何将JavaScript性能优化技术应用到实际场景中。大型应用的模块懒加载、虚拟列表和状态管理优化，以及移动端的触摸事件优化、图片懒加载和动画优化，都是提升应用性能的有效手段。在下一篇文章中，我们将探讨JavaScript性能优化的未来趋势与展望。`;export{n as default};
//# sourceMappingURL=08-5-DwvupTzX.js.map
