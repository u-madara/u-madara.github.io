const n=`---
title: "微前端性能优化与监控"
excerpt: "深入探讨微前端架构中的性能优化策略和监控方案，帮助开发者构建高性能、可观测的微前端应用"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-12-10"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# 微前端性能优化与监控

## 引言

随着微前端架构的普及，性能优化和监控成为确保用户体验的关键因素。微前端系统由多个独立应用组成，每个应用的性能问题都可能影响整体用户体验。本文将深入探讨微前端环境下的性能优化策略和监控方案，帮助开发者构建高性能、可观测的微前端系统。

## 微前端性能挑战

### 1. 资源加载性能

微前端架构中，多个应用的资源需要合理加载，避免重复加载和阻塞渲染。

\`\`\`javascript
// 资源加载性能监控
class ResourceLoadMonitor {
  constructor() {
    this.resources = new Map();
    this.observers = new Map();
    this.setupResourceObserver();
  }
  
  // 设置资源观察器
  setupResourceObserver() {
    if ('PerformanceObserver' in window) {
      // 监控资源加载时间
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordResourceTiming(entry);
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    }
  }
  
  // 记录资源加载时间
  recordResourceTiming(entry) {
    const timing = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      startTime: entry.startTime,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      timestamp: Date.now()
    };
    
    this.resources.set(entry.name, timing);
    
    // 触发性能警告
    if (timing.duration > 3000) {
      console.warn(\`Slow resource loading: \${entry.name} took \${timing.duration}ms\`);
      this.reportSlowResource(timing);
    }
  }
  
  // 获取资源类型
  getResourceType(url) {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'script';
      case 'css':
        return 'stylesheet';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'eot':
        return 'font';
      default:
        return 'other';
    }
  }
  
  // 报告慢资源
  reportSlowResource(timing) {
    // 发送到监控系统
    this.sendToMonitoring({
      type: 'slow_resource',
      data: timing
    });
  }
  
  // 获取资源统计
  getResourceStats() {
    const stats = {
      totalResources: this.resources.size,
      totalSize: 0,
      totalLoadTime: 0,
      byType: {}
    };
    
    this.resources.forEach((timing) => {
      stats.totalSize += timing.transferSize || 0;
      stats.totalLoadTime += timing.duration;
      
      if (!stats.byType[timing.type]) {
        stats.byType[timing.type] = {
          count: 0,
          size: 0,
          loadTime: 0
        };
      }
      
      stats.byType[timing.type].count++;
      stats.byType[timing.type].size += timing.transferSize || 0;
      stats.byType[timing.type].loadTime += timing.duration;
    });
    
    return stats;
  }
  
  // 发送到监控系统
  sendToMonitoring(data) {
    // 实际项目中，这里会发送到监控系统
    console.log('Monitoring data:', data);
  }
}

// 使用示例
const resourceMonitor = new ResourceLoadMonitor();

// 获取资源统计
setTimeout(() => {
  const stats = resourceMonitor.getResourceStats();
  console.log('Resource stats:', stats);
}, 5000);
\`\`\`

### 2. 应用切换性能

微前端中应用切换的性能直接影响用户体验，需要优化切换流程和资源管理。

\`\`\`javascript
// 应用切换性能优化
class AppSwitchOptimizer {
  constructor(options = {}) {
    this.options = {
      preloadApps: true,
      cacheApps: true,
      maxCacheSize: 3,
      switchTimeout: 5000,
      ...options
    };
    
    this.appCache = new Map();
    this.preloadQueue = [];
    this.switchMetrics = new Map();
  }
  
  // 预加载应用
  async preloadApp(appName, appConfig) {
    if (this.appCache.has(appName)) {
      return this.appCache.get(appName);
    }
    
    try {
      const startTime = performance.now();
      
      // 创建预加载容器（隐藏）
      const preloadContainer = document.createElement('div');
      preloadContainer.style.display = 'none';
      document.body.appendChild(preloadContainer);
      
      // 加载应用
      const app = await this.loadApp(appConfig, preloadContainer);
      
      // 记录加载时间
      const loadTime = performance.now() - startTime;
      this.recordLoadMetric(appName, loadTime);
      
      // 缓存应用
      if (this.options.cacheApps) {
        this.addToCache(appName, app);
      }
      
      // 移除预加载容器
      document.body.removeChild(preloadContainer);
      
      return app;
    } catch (error) {
      console.error(\`Failed to preload app \${appName}:\`, error);
      throw error;
    }
  }
  
  // 加载应用
  async loadApp(appConfig, container) {
    // 实际项目中，这里会调用微前端框架的加载方法
    // 这里简化为模拟加载
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          name: appConfig.name,
          container,
          loaded: true
        });
      }, Math.random() * 1000 + 500);
    });
  }
  
  // 切换应用
  async switchApp(fromAppName, toAppName, toAppConfig, targetContainer) {
    const switchStartTime = performance.now();
    
    try {
      // 设置切换超时
      const switchPromise = this.performSwitch(fromAppName, toAppName, toAppConfig, targetContainer);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('App switch timeout')), this.options.switchTimeout);
      });
      
      await Promise.race([switchPromise, timeoutPromise]);
      
      // 记录切换时间
      const switchTime = performance.now() - switchStartTime;
      this.recordSwitchMetric(fromAppName, toAppName, switchTime);
      
      return true;
    } catch (error) {
      console.error(\`Failed to switch from \${fromAppName} to \${toAppName}:\`, error);
      
      // 记录失败指标
      const switchTime = performance.now() - switchStartTime;
      this.recordSwitchMetric(fromAppName, toAppName, switchTime, false);
      
      throw error;
    }
  }
  
  // 执行切换
  async performSwitch(fromAppName, toAppName, toAppConfig, targetContainer) {
    // 获取目标应用
    let toApp = this.appCache.get(toAppName);
    
    if (!toApp) {
      // 如果未缓存，直接加载
      toApp = await this.loadApp(toAppConfig, targetContainer);
    } else {
      // 如果已缓存，移动到目标容器
      targetContainer.appendChild(toApp.container);
      toApp.container.style.display = 'block';
    }
    
    // 隐藏原应用
    if (fromAppName) {
      const fromApp = this.appCache.get(fromAppName);
      if (fromApp) {
        fromApp.container.style.display = 'none';
      }
    }
    
    return toApp;
  }
  
  // 添加到缓存
  addToCache(appName, app) {
    // 检查缓存大小限制
    if (this.appCache.size >= this.options.maxCacheSize) {
      // 移除最旧的应用
      const oldestApp = this.appCache.keys().next().value;
      this.removeFromCache(oldestApp);
    }
    
    this.appCache.set(appName, app);
  }
  
  // 从缓存中移除
  removeFromCache(appName) {
    const app = this.appCache.get(appName);
    if (app) {
      // 清理应用资源
      if (app.container && app.container.parentNode) {
        app.container.parentNode.removeChild(app.container);
      }
      
      this.appCache.delete(appName);
    }
  }
  
  // 记录加载指标
  recordLoadMetric(appName, loadTime) {
    if (!this.switchMetrics.has(appName)) {
      this.switchMetrics.set(appName, {
        loads: [],
        switches: []
      });
    }
    
    this.switchMetrics.get(appName).loads.push({
      time: loadTime,
      timestamp: Date.now()
    });
  }
  
  // 记录切换指标
  recordSwitchMetric(fromAppName, toAppName, switchTime, success = true) {
    if (!this.switchMetrics.has(toAppName)) {
      this.switchMetrics.set(toAppName, {
        loads: [],
        switches: []
      });
    }
    
    this.switchMetrics.get(toAppName).switches.push({
      from: fromAppName,
      to: toAppName,
      time: switchTime,
      success,
      timestamp: Date.now()
    });
  }
  
  // 获取性能指标
  getPerformanceMetrics() {
    const metrics = {};
    
    this.switchMetrics.forEach((appMetrics, appName) => {
      const loads = appMetrics.loads;
      const switches = appMetrics.switches;
      
      metrics[appName] = {
        loadCount: loads.length,
        avgLoadTime: loads.length > 0 
          ? loads.reduce((sum, load) => sum + load.time, 0) / loads.length 
          : 0,
        switchCount: switches.length,
        avgSwitchTime: switches.length > 0 
          ? switches.reduce((sum, switch_) => sum + switch_.time, 0) / switches.length 
          : 0,
        successRate: switches.length > 0 
          ? switches.filter(s => s.success).length / switches.length 
          : 1
      };
    });
    
    return metrics;
  }
}

// 使用示例
const appSwitchOptimizer = new AppSwitchOptimizer({
  preloadApps: true,
  cacheApps: true,
  maxCacheSize: 3
});

// 预加载应用
appSwitchOptimizer.preloadApp('app1', { name: 'app1' });
appSwitchOptimizer.preloadApp('app2', { name: 'app2' });

// 切换应用
const container = document.getElementById('app-container');
appSwitchOptimizer.switchApp('app1', 'app2', { name: 'app2' }, container);

// 获取性能指标
setTimeout(() => {
  const metrics = appSwitchOptimizer.getPerformanceMetrics();
  console.log('App switch metrics:', metrics);
}, 10000);
\`\`\`

## 性能优化策略

### 1. 资源优化

#### 代码分割与懒加载

\`\`\`javascript
// 微前端代码分割与懒加载
class MicroFrontendCodeSplitter {
  constructor(options = {}) {
    this.options = {
      chunkSize: 50 * 1024, // 50KB
      enableLazyLoading: true,
      preloadStrategy: 'intersection', // 'intersection', 'idle', 'manual'
      ...options
    };
    
    this.loadedChunks = new Map();
    this.chunkQueue = [];
    this.intersectionObserver = null;
    
    if (this.options.preloadStrategy === 'intersection') {
      this.setupIntersectionObserver();
    }
  }
  
  // 设置交叉观察器
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const chunkId = entry.target.getAttribute('data-chunk-id');
            if (chunkId) {
              this.loadChunk(chunkId);
            }
          }
        });
      }, {
        rootMargin: '100px' // 提前100px加载
      });
    }
  }
  
  // 分割代码
  splitCode(code, appName) {
    const chunks = [];
    let currentChunk = '';
    let currentSize = 0;
    
    // 简单的代码分割逻辑（实际项目中会使用webpack等工具）
    const lines = code.split('\\n');
    
    for (const line of lines) {
      const lineSize = new Blob([line]).size;
      
      if (currentSize + lineSize > this.options.chunkSize && currentChunk) {
        chunks.push({
          id: \`\${appName}-chunk-\${chunks.length}\`,
          content: currentChunk,
          size: currentSize
        });
        
        currentChunk = line + '\\n';
        currentSize = lineSize;
      } else {
        currentChunk += line + '\\n';
        currentSize += lineSize;
      }
    }
    
    // 添加最后一个块
    if (currentChunk) {
      chunks.push({
        id: \`\${appName}-chunk-\${chunks.length}\`,
        content: currentChunk,
        size: currentSize
      });
    }
    
    return chunks;
  }
  
  // 加载块
  async loadChunk(chunkId) {
    if (this.loadedChunks.has(chunkId)) {
      return this.loadedChunks.get(chunkId);
    }
    
    try {
      // 实际项目中，这里会从服务器加载代码块
      // 这里简化为模拟加载
      const chunk = await this.fetchChunk(chunkId);
      
      // 执行代码
      this.executeChunk(chunk);
      
      // 标记为已加载
      this.loadedChunks.set(chunkId, chunk);
      
      return chunk;
    } catch (error) {
      console.error(\`Failed to load chunk \${chunkId}:\`, error);
      throw error;
    }
  }
  
  // 获取代码块
  async fetchChunk(chunkId) {
    // 模拟网络请求
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: chunkId,
          content: \`// Chunk \${chunkId} content\`,
          loaded: true
        });
      }, Math.random() * 500 + 100);
    });
  }
  
  // 执行代码块
  executeChunk(chunk) {
    try {
      // 在实际项目中，这里会安全地执行代码
      // 这里简化为console.log
      console.log(\`Executing chunk: \${chunk.id}\`);
    } catch (error) {
      console.error(\`Failed to execute chunk \${chunk.id}:\`, error);
    }
  }
  
  // 预加载块
  async preloadChunk(chunkId) {
    if (!this.loadedChunks.has(chunkId)) {
      this.chunkQueue.push(chunkId);
      
      if (this.options.preloadStrategy === 'idle') {
        this.preloadWhenIdle();
      }
    }
  }
  
  // 空闲时预加载
  preloadWhenIdle() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        if (this.chunkQueue.length > 0) {
          const chunkId = this.chunkQueue.shift();
          this.loadChunk(chunkId);
        }
      });
    } else {
      // 降级到setTimeout
      setTimeout(() => {
        if (this.chunkQueue.length > 0) {
          const chunkId = this.chunkQueue.shift();
          this.loadChunk(chunkId);
        }
      }, 100);
    }
  }
  
  // 注册懒加载元素
  registerLazyElement(element, chunkId) {
    element.setAttribute('data-chunk-id', chunkId);
    
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }
  
  // 获取加载统计
  getLoadStats() {
    return {
      loadedChunks: this.loadedChunks.size,
      queuedChunks: this.chunkQueue.length,
      totalChunks: this.loadedChunks.size + this.chunkQueue.length
    };
  }
}

// 使用示例
const codeSplitter = new MicroFrontendCodeSplitter({
  chunkSize: 30 * 1024, // 30KB
  enableLazyLoading: true,
  preloadStrategy: 'intersection'
});

// 模拟应用代码
const appCode = \`
// 大量应用代码...
function initApp() {
  console.log('App initialized');
}

function renderComponent() {
  // 组件渲染逻辑
}

// 更多代码...
\`;

// 分割代码
const chunks = codeSplitter.splitCode(appCode, 'my-app');
console.log('Code chunks:', chunks);

// 注册懒加载元素
const lazyElement = document.getElementById('lazy-component');
if (lazyElement) {
  codeSplitter.registerLazyElement(lazyElement, 'my-app-chunk-1');
}

// 预加载代码块
codeSplitter.preloadChunk('my-app-chunk-0');

// 获取加载统计
setTimeout(() => {
  const stats = codeSplitter.getLoadStats();
  console.log('Load stats:', stats);
}, 5000);
\`\`\`

#### 资源缓存策略

\`\`\`javascript
// 微前端资源缓存策略
class MicroFrontendCache {
  constructor(options = {}) {
    this.options = {
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      storageType: 'memory', // 'memory', 'localStorage', 'indexedDB'
      ...options
    };
    
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    if (this.options.storageType === 'indexedDB') {
      this.initIndexedDB();
    }
  }
  
  // 初始化IndexedDB
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MicroFrontendCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('resources')) {
          const store = db.createObjectStore('resources', { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }
  
  // 缓存资源
  async cacheResource(url, content, type = 'text') {
    const resource = {
      url,
      content,
      type,
      timestamp: Date.now(),
      size: this.getResourceSize(content, type),
      accessCount: 0
    };
    
    // 检查缓存大小
    await this.ensureCacheSize(resource.size);
    
    // 存储资源
    switch (this.options.storageType) {
      case 'memory':
        this.cache.set(url, resource);
        break;
      case 'localStorage':
        this.cacheInLocalStorage(url, resource);
        break;
      case 'indexedDB':
        await this.cacheInIndexedDB(resource);
        break;
    }
    
    return resource;
  }
  
  // 获取资源
  async getResource(url) {
    let resource;
    
    switch (this.options.storageType) {
      case 'memory':
        resource = this.cache.get(url);
        break;
      case 'localStorage':
        resource = this.getFromLocalStorage(url);
        break;
      case 'indexedDB':
        resource = await this.getFromIndexedDB(url);
        break;
    }
    
    if (resource) {
      // 检查是否过期
      if (Date.now() - resource.timestamp > this.options.maxAge) {
        this.removeResource(url);
        this.cacheStats.misses++;
        return null;
      }
      
      // 更新访问计数
      resource.accessCount++;
      this.cacheStats.hits++;
      
      // 更新访问时间
      if (this.options.storageType === 'memory') {
        this.cache.set(url, resource);
      } else if (this.options.storageType === 'indexedDB') {
        await this.updateInIndexedDB(resource);
      }
      
      return resource;
    } else {
      this.cacheStats.misses++;
      return null;
    }
  }
  
  // 移除资源
  async removeResource(url) {
    switch (this.options.storageType) {
      case 'memory':
        this.cache.delete(url);
        break;
      case 'localStorage':
        localStorage.removeItem(\`mf-cache-\${url}\`);
        break;
      case 'indexedDB':
        await this.removeFromIndexedDB(url);
        break;
    }
  }
  
  // 确保缓存大小
  async ensureCacheSize(newResourceSize) {
    let currentSize = await this.getCurrentCacheSize();
    
    if (currentSize + newResourceSize > this.options.maxCacheSize) {
      // 按LRU策略移除资源
      const resources = await this.getAllResources();
      
      // 按访问时间排序
      resources.sort((a, b) => a.timestamp - b.timestamp);
      
      // 移除最旧资源直到有足够空间
      for (const resource of resources) {
        await this.removeResource(resource.url);
        currentSize -= resource.size;
        this.cacheStats.evictions++;
        
        if (currentSize + newResourceSize <= this.options.maxCacheSize) {
          break;
        }
      }
    }
  }
  
  // 获取当前缓存大小
  async getCurrentCacheSize() {
    switch (this.options.storageType) {
      case 'memory':
        let size = 0;
        this.cache.forEach(resource => {
          size += resource.size;
        });
        return size;
        
      case 'localStorage':
        size = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('mf-cache-')) {
            const value = localStorage.getItem(key);
            size += value ? value.length : 0;
          }
        }
        return size;
        
      case 'indexedDB':
        return this.getIndexedDBSize();
        
      default:
        return 0;
    }
  }
  
  // 获取所有资源
  async getAllResources() {
    switch (this.options.storageType) {
      case 'memory':
        return Array.from(this.cache.values());
        
      case 'localStorage':
        const resources = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('mf-cache-')) {
            const url = key.substring(9); // 移除'mf-cache-'前缀
            const resource = this.getFromLocalStorage(url);
            if (resource) {
              resources.push(resource);
            }
          }
        }
        return resources;
        
      case 'indexedDB':
        return this.getAllFromIndexedDB();
        
      default:
        return [];
    }
  }
  
  // 获取资源大小
  getResourceSize(content, type) {
    if (type === 'blob') {
      return content.size;
    } else {
      return new Blob([content]).size;
    }
  }
  
  // localStorage缓存
  cacheInLocalStorage(url, resource) {
    try {
      localStorage.setItem(\`mf-cache-\${url}\`, JSON.stringify(resource));
    } catch (error) {
      console.error('Failed to cache in localStorage:', error);
    }
  }
  
  // 从localStorage获取
  getFromLocalStorage(url) {
    try {
      const item = localStorage.getItem(\`mf-cache-\${url}\`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to get from localStorage:', error);
      return null;
    }
  }
  
  // IndexedDB缓存
  async cacheInIndexedDB(resource) {
    if (!this.db) {
      await this.initIndexedDB();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['resources'], 'readwrite');
      const store = transaction.objectStore('resources');
      const request = store.put(resource);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // 从IndexedDB获取
  async getFromIndexedDB(url) {
    if (!this.db) {
      await this.initIndexedDB();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['resources'], 'readonly');
      const store = transaction.objectStore('resources');
      const request = store.get(url);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 从IndexedDB移除
  async removeFromIndexedDB(url) {
    if (!this.db) {
      await this.initIndexedDB();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['resources'], 'readwrite');
      const store = transaction.objectStore('resources');
      const request = store.delete(url);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // 更新IndexedDB中的资源
  async updateInIndexedDB(resource) {
    if (!this.db) {
      await this.initIndexedDB();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['resources'], 'readwrite');
      const store = transaction.objectStore('resources');
      const request = store.put(resource);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // 获取IndexedDB中的所有资源
  async getAllFromIndexedDB() {
    if (!this.db) {
      await this.initIndexedDB();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['resources'], 'readonly');
      const store = transaction.objectStore('resources');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // 获取IndexedDB大小
  async getIndexedDBSize() {
    const resources = await this.getAllFromIndexedDB();
    return resources.reduce((total, resource) => total + resource.size, 0);
  }
  
  // 获取缓存统计
  getCacheStats() {
    return {
      ...this.cacheStats,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
    };
  }
  
  // 清空缓存
  async clearCache() {
    switch (this.options.storageType) {
      case 'memory':
        this.cache.clear();
        break;
      case 'localStorage':
        // 移除所有微前端缓存项
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('mf-cache-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        break;
      case 'indexedDB':
        if (!this.db) {
          await this.initIndexedDB();
        }
        
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['resources'], 'readwrite');
          const store = transaction.objectStore('resources');
          const request = store.clear();
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
    }
    
    // 重置统计
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }
}

// 使用示例
const resourceCache = new MicroFrontendCache({
  maxCacheSize: 20 * 1024 * 1024, // 20MB
  maxAge: 12 * 60 * 60 * 1000, // 12小时
  storageType: 'indexedDB'
});

// 缓存资源
resourceCache.cacheResource(
  'https://example.com/app1.js',
  'console.log("App 1 loaded");',
  'text'
);

// 获取资源
resourceCache.getResource('https://example.com/app1.js').then(resource => {
  if (resource) {
    console.log('Resource from cache:', resource.content);
  } else {
    console.log('Resource not in cache');
  }
});

// 获取缓存统计
setTimeout(() => {
  const stats = resourceCache.getCacheStats();
  console.log('Cache stats:', stats);
}, 2000);
\`\`\`

### 2. 运行时性能优化

#### 应用沙箱优化

\`\`\`javascript
// 微前端沙箱性能优化
class OptimizedSandbox {
  constructor(name, options = {}) {
    this.name = name;
    this.options = {
      enablePerformanceMonitoring: true,
      enableLazyProxy: true,
      proxyCacheSize: 1000,
      ...options
    };
    
    this.active = false;
    this.globalVariableMap = new Map();
    this.proxyCache = new Map();
    this.performanceMetrics = {
      proxyCalls: 0,
      proxyTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.createOptimizedProxy();
  }
  
  // 创建优化的代理
  createOptimizedProxy() {
    const self = this;
    
    // 预定义常用属性，避免代理拦截
    const commonProps = [
      'document', 'location', 'navigator', 'history',
      'localStorage', 'sessionStorage', 'console',
      'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
      'requestAnimationFrame', 'cancelAnimationFrame',
      'addEventListener', 'removeEventListener', 'dispatchEvent'
    ];
    
    // 创建基础对象
    const baseObject = {};
    
    // 预填充常用属性
    commonProps.forEach(prop => {
      if (prop in window) {
        baseObject[prop] = window[prop];
      }
    });
    
    this.proxyWindow = new Proxy(baseObject, {
      get(target, prop) {
        // 性能监控
        if (self.options.enablePerformanceMonitoring) {
          self.performanceMetrics.proxyCalls++;
          const startTime = performance.now();
        }
        
        // 优先从沙箱中获取
        if (self.globalVariableMap.has(prop)) {
          return self.globalVariableMap.get(prop);
        }
        
        // 检查代理缓存
        if (self.options.enableLazyProxy && self.proxyCache.has(prop)) {
          self.performanceMetrics.cacheHits++;
          return self.proxyCache.get(prop);
        }
        
        // 从真实window中获取
        const value = window[prop];
        
        // 处理函数属性
        if (typeof value === 'function' && self.shouldWrapFunction(prop)) {
          const wrappedFunction = value.bind(window);
          
          // 添加到缓存
          if (self.options.enableLazyProxy) {
            self.proxyCache.set(prop, wrappedFunction);
            
            // 限制缓存大小
            if (self.proxyCache.size > self.options.proxyCacheSize) {
              const firstKey = self.proxyCache.keys().next().value;
              self.proxyCache.delete(firstKey);
            }
          }
          
          self.performanceMetrics.cacheMisses++;
          return wrappedFunction;
        }
        
        self.performanceMetrics.cacheMisses++;
        return value;
      },
      
      set(target, prop, value) {
        if (self.active) {
          // 沙箱运行时，将修改记录到沙箱中
          self.globalVariableMap.set(prop, value);
          return true;
        }
        
        // 沙箱未运行时，直接修改真实window
        window[prop] = value;
        return true;
      },
      
      has(target, prop) {
        return prop in self.globalVariableMap || prop in window;
      },
      
      deleteProperty(target, prop) {
        if (self.active) {
          if (self.globalVariableMap.has(prop)) {
            self.globalVariableMap.delete(prop);
            return true;
          }
          return false;
        }
        
        delete window[prop];
        return true;
      }
    });
  }
  
  // 判断是否应该包装函数
  shouldWrapFunction(prop) {
    // 包装window对象上的函数，确保this指向正确
    return [
      'addEventListener',
      'removeEventListener',
      'dispatchEvent',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'fetch',
      'Promise',
      'MutationObserver',
      'IntersectionObserver',
      'ResizeObserver'
    ].includes(prop);
  }
  
  // 激活沙箱
  active() {
    this.active = true;
    
    // 重置性能指标
    if (this.options.enablePerformanceMonitoring) {
      this.performanceMetrics = {
        proxyCalls: 0,
        proxyTime: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    }
  }
  
  // 非激活沙箱
  inactive() {
    this.active = false;
    
    // 清空代理缓存
    this.proxyCache.clear();
  }
  
  // 获取性能指标
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.cacheHits / 
        (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) || 0,
      avgProxyTime: this.performanceMetrics.proxyCalls > 0 
        ? this.performanceMetrics.proxyTime / this.performanceMetrics.proxyCalls 
        : 0
    };
  }
}

// 使用示例
const optimizedSandbox = new OptimizedSandbox('app1', {
  enablePerformanceMonitoring: true,
  enableLazyProxy: true,
  proxyCacheSize: 500
});

// 激活沙箱
optimizedSandbox.active();

// 在沙箱中运行代码
const proxyWindow = optimizedSandbox.proxyWindow;
proxyWindow.appVariable = 'App 1 variable';
proxyWindow.setTimeout(() => {
  console.log('Timeout in sandbox');
}, 1000);

// 获取性能指标
setTimeout(() => {
  const metrics = optimizedSandbox.getPerformanceMetrics();
  console.log('Sandbox performance metrics:', metrics);
}, 2000);
\`\`\`

## 性能监控方案

### 1. 关键性能指标监控

\`\`\`javascript
// 微前端关键性能指标监控
class MicroFrontendPerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      sampleRate: 0.1, // 10%采样率
      reportInterval: 30000, // 30秒上报一次
      maxMetricsCount: 100,
      ...options
    };
    
    this.metrics = [];
    this.observers = new Map();
    this.setupPerformanceObservers();
    this.startPeriodicReporting();
  }
  
  // 设置性能观察器
  setupPerformanceObservers() {
    // 观察导航性能
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordNavigationMetrics(entry);
          }
        }
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);
      
      // 观察资源性能
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordResourceMetrics(entry);
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
      
      // 观察长任务
      if ('PerformanceObserver' in window && 'longtask' in PerformanceObserver.supportedEntryTypes) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              this.recordLongTaskMetrics(entry);
            }
          }
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      }
      
      // 观察首次内容绘制和最大内容绘制
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            this.recordPaintMetrics(entry);
          }
        }
      });
      
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', paintObserver);
    }
  }
  
  // 记录导航指标
  recordNavigationMetrics(entry) {
    const metrics = {
      type: 'navigation',
      timestamp: Date.now(),
      url: entry.name,
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domParse: entry.domContentLoadedEventStart - entry.responseEnd,
      domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      totalTime: entry.loadEventEnd - entry.navigationStart
    };
    
    this.addMetrics(metrics);
  }
  
  // 记录资源指标
  recordResourceMetrics(entry) {
    const metrics = {
      type: 'resource',
      timestamp: Date.now(),
      name: entry.name,
      resourceType: this.getResourceType(entry.name),
      startTime: entry.startTime,
      duration: entry.duration,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    };
    
    this.addMetrics(metrics);
  }
  
  // 记录长任务指标
  recordLongTaskMetrics(entry) {
    const metrics = {
      type: 'longtask',
      timestamp: Date.now(),
      duration: entry.duration,
      startTime: entry.startTime
    };
    
    this.addMetrics(metrics);
    
    // 如果长任务超过50ms，记录为性能问题
    if (entry.duration > 50) {
      this.reportPerformanceIssue('long_task', metrics);
    }
  }
  
  // 记录绘制指标
  recordPaintMetrics(entry) {
    const metrics = {
      type: 'paint',
      timestamp: Date.now(),
      name: entry.name,
      time: entry.startTime
    };
    
    this.addMetrics(metrics);
  }
  
  // 记录应用加载指标
  recordAppLoadMetrics(appName, loadTime, success) {
    const metrics = {
      type: 'app_load',
      timestamp: Date.now(),
      appName,
      loadTime,
      success
    };
    
    this.addMetrics(metrics);
    
    // 如果加载时间超过3秒，记录为性能问题
    if (loadTime > 3000) {
      this.reportPerformanceIssue('slow_app_load', metrics);
    }
  }
  
  // 记录应用切换指标
  recordAppSwitchMetrics(fromApp, toApp, switchTime, success) {
    const metrics = {
      type: 'app_switch',
      timestamp: Date.now(),
      fromApp,
      toApp,
      switchTime,
      success
    };
    
    this.addMetrics(metrics);
    
    // 如果切换时间超过1秒，记录为性能问题
    if (switchTime > 1000) {
      this.reportPerformanceIssue('slow_app_switch', metrics);
    }
  }
  
  // 记录内存使用指标
  recordMemoryMetrics() {
    if ('memory' in performance) {
      const metrics = {
        type: 'memory',
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
      
      this.addMetrics(metrics);
      
      // 如果内存使用超过80%，记录为性能问题
      const memoryUsageRatio = metrics.usedJSHeapSize / metrics.jsHeapSizeLimit;
      if (memoryUsageRatio > 0.8) {
        this.reportPerformanceIssue('high_memory_usage', metrics);
      }
    }
  }
  
  // 添加指标
  addMetrics(metrics) {
    // 采样控制
    if (Math.random() > this.options.sampleRate) {
      return;
    }
    
    this.metrics.push(metrics);
    
    // 限制指标数量
    if (this.metrics.length > this.options.maxMetricsCount) {
      this.metrics.shift();
    }
  }
  
  // 获取资源类型
  getResourceType(url) {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'script';
      case 'css':
        return 'stylesheet';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'eot':
        return 'font';
      default:
        return 'other';
    }
  }
  
  // 报告性能问题
  reportPerformanceIssue(type, metrics) {
    // 实际项目中，这里会发送到监控系统
    console.warn(\`Performance issue detected: \${type}\`, metrics);
    
    // 也可以使用Reporting API
    if ('ReportingObserver' in window) {
      // 这里可以创建自定义报告
    }
  }
  
  // 获取性能摘要
  getPerformanceSummary() {
    const summary = {
      timestamp: Date.now(),
      metrics: {
        navigation: this.getNavigationSummary(),
        resources: this.getResourceSummary(),
        longTasks: this.getLongTaskSummary(),
        paint: this.getPaintSummary(),
        appLoad: this.getAppLoadSummary(),
        appSwitch: this.getAppSwitchSummary(),
        memory: this.getMemorySummary()
      }
    };
    
    return summary;
  }
  
  // 获取导航摘要
  getNavigationSummary() {
    const navigationMetrics = this.metrics.filter(m => m.type === 'navigation');
    
    if (navigationMetrics.length === 0) {
      return null;
    }
    
    const latest = navigationMetrics[navigationMetrics.length - 1];
    
    return {
      totalTime: latest.totalTime,
      dns: latest.dns,
      tcp: latest.tcp,
      ssl: latest.ssl,
      ttfb: latest.ttfb,
      download: latest.download,
      domParse: latest.domParse,
      domReady: latest.domReady,
      loadComplete: latest.loadComplete
    };
  }
  
  // 获取资源摘要
  getResourceSummary() {
    const resourceMetrics = this.metrics.filter(m => m.type === 'resource');
    
    if (resourceMetrics.length === 0) {
      return null;
    }
    
    const byType = {};
    let totalSize = 0;
    let totalDuration = 0;
    let cachedCount = 0;
    
    resourceMetrics.forEach(metric => {
      if (!byType[metric.resourceType]) {
        byType[metric.resourceType] = {
          count: 0,
          size: 0,
          duration: 0,
          cached: 0
        };
      }
      
      byType[metric.resourceType].count++;
      byType[metric.resourceType].size += metric.size;
      byType[metric.resourceType].duration += metric.duration;
      
      if (metric.cached) {
        byType[metric.resourceType].cached++;
        cachedCount++;
      }
      
      totalSize += metric.size;
      totalDuration += metric.duration;
    });
    
    return {
      totalResources: resourceMetrics.length,
      totalSize,
      totalDuration,
      cachedCount,
      cacheHitRate: cachedCount / resourceMetrics.length,
      byType
    };
  }
  
  // 获取长任务摘要
  getLongTaskSummary() {
    const longTaskMetrics = this.metrics.filter(m => m.type === 'longtask');
    
    if (longTaskMetrics.length === 0) {
      return null;
    }
    
    const totalDuration = longTaskMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const maxDuration = Math.max(...longTaskMetrics.map(m => m.duration));
    
    return {
      count: longTaskMetrics.length,
      totalDuration,
      maxDuration,
      avgDuration: totalDuration / longTaskMetrics.length
    };
  }
  
  // 获取绘制摘要
  getPaintSummary() {
    const paintMetrics = this.metrics.filter(m => m.type === 'paint');
    
    if (paintMetrics.length === 0) {
      return null;
    }
    
    const summary = {};
    paintMetrics.forEach(metric => {
      summary[metric.name] = metric.time;
    });
    
    return summary;
  }
  
  // 获取应用加载摘要
  getAppLoadSummary() {
    const appLoadMetrics = this.metrics.filter(m => m.type === 'app_load');
    
    if (appLoadMetrics.length === 0) {
      return null;
    }
    
    const byApp = {};
    let totalLoadTime = 0;
    let successCount = 0;
    
    appLoadMetrics.forEach(metric => {
      if (!byApp[metric.appName]) {
        byApp[metric.appName] = {
          count: 0,
          totalLoadTime: 0,
          successCount: 0
        };
      }
      
      byApp[metric.appName].count++;
      byApp[metric.appName].totalLoadTime += metric.loadTime;
      
      if (metric.success) {
        byApp[metric.appName].successCount++;
        successCount++;
      }
      
      totalLoadTime += metric.loadTime;
    });
    
    // 计算平均值
    Object.keys(byApp).forEach(appName => {
      const app = byApp[appName];
      app.avgLoadTime = app.totalLoadTime / app.count;
      app.successRate = app.successCount / app.count;
    });
    
    return {
      totalLoads: appLoadMetrics.length,
      totalLoadTime,
      avgLoadTime: totalLoadTime / appLoadMetrics.length,
      successRate: successCount / appLoadMetrics.length,
      byApp
    };
  }
  
  // 获取应用切换摘要
  getAppSwitchSummary() {
    const appSwitchMetrics = this.metrics.filter(m => m.type === 'app_switch');
    
    if (appSwitchMetrics.length === 0) {
      return null;
    }
    
    const byTransition = {};
    let totalSwitchTime = 0;
    let successCount = 0;
    
    appSwitchMetrics.forEach(metric => {
      const transition = \`\${metric.fromApp} → \${metric.toApp}\`;
      
      if (!byTransition[transition]) {
        byTransition[transition] = {
          count: 0,
          totalSwitchTime: 0,
          successCount: 0
        };
      }
      
      byTransition[transition].count++;
      byTransition[transition].totalSwitchTime += metric.switchTime;
      
      if (metric.success) {
        byTransition[transition].successCount++;
        successCount++;
      }
      
      totalSwitchTime += metric.switchTime;
    });
    
    // 计算平均值
    Object.keys(byTransition).forEach(transition => {
      const t = byTransition[transition];
      t.avgSwitchTime = t.totalSwitchTime / t.count;
      t.successRate = t.successCount / t.count;
    });
    
    return {
      totalSwitches: appSwitchMetrics.length,
      totalSwitchTime,
      avgSwitchTime: totalSwitchTime / appSwitchMetrics.length,
      successRate: successCount / appSwitchMetrics.length,
      byTransition
    };
  }
  
  // 获取内存摘要
  getMemorySummary() {
    const memoryMetrics = this.metrics.filter(m => m.type === 'memory');
    
    if (memoryMetrics.length === 0) {
      return null;
    }
    
    const latest = memoryMetrics[memoryMetrics.length - 1];
    
    return {
      usedJSHeapSize: latest.usedJSHeapSize,
      totalJSHeapSize: latest.totalJSHeapSize,
      jsHeapSizeLimit: latest.jsHeapSizeLimit,
      usageRatio: latest.usedJSHeapSize / latest.jsHeapSizeLimit
    };
  }
  
  // 开始定期报告
  startPeriodicReporting() {
    setInterval(() => {
      const summary = this.getPerformanceSummary();
      this.reportMetrics(summary);
    }, this.options.reportInterval);
  }
  
  // 上报指标
  reportMetrics(metrics) {
    // 实际项目中，这里会发送到监控系统
    console.log('Performance metrics:', metrics);
    
    // 也可以使用sendBeacon API
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon('/api/performance', JSON.stringify(metrics));
    }
  }
  
  // 清理
  cleanup() {
    // 停止所有观察器
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// 使用示例
const performanceMonitor = new MicroFrontendPerformanceMonitor({
  sampleRate: 0.1,
  reportInterval: 30000
});

// 记录应用加载指标
performanceMonitor.recordAppLoadMetrics('app1', 1500, true);

// 记录应用切换指标
performanceMonitor.recordAppSwitchMetrics('app1', 'app2', 800, true);

// 定期记录内存使用
setInterval(() => {
  performanceMonitor.recordMemoryMetrics();
}, 10000);

// 获取性能摘要
setTimeout(() => {
  const summary = performanceMonitor.getPerformanceSummary();
  console.log('Performance summary:', summary);
}, 5000);
\`\`\`

## 实际应用案例

### 微前端电商平台性能优化

下面是一个完整的微前端电商平台性能优化案例：

\`\`\`javascript
// 电商平台微前端性能优化方案
class EcommercePlatformOptimizer {
  constructor() {
    this.apps = new Map();
    this.performanceMonitor = new MicroFrontendPerformanceMonitor({
      sampleRate: 0.2,
      reportInterval: 20000
    });
    
    this.resourceCache = new MicroFrontendCache({
      maxCacheSize: 30 * 1024 * 1024, // 30MB
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      storageType: 'indexedDB'
    });
    
    this.appSwitchOptimizer = new AppSwitchOptimizer({
      preloadApps: true,
      cacheApps: true,
      maxCacheSize: 3
    });
    
    this.setupPerformanceOptimizations();
  }
  
  // 设置性能优化
  setupPerformanceOptimizations() {
    // 预加载关键应用
    this.preloadCriticalApps();
    
    // 设置资源懒加载
    this.setupLazyLoading();
    
    // 监控页面可见性变化
    this.setupVisibilityHandling();
    
    // 监控网络状态
    this.setupNetworkHandling();
  }
  
  // 预加载关键应用
  async preloadCriticalApps() {
    const criticalApps = ['home', 'search', 'product'];
    
    for (const appName of criticalApps) {
      try {
        await this.appSwitchOptimizer.preloadApp(appName, {
          name: appName,
          url: \`/apps/\${appName}/index.html\`
        });
        
        console.log(\`Preloaded critical app: \${appName}\`);
      } catch (error) {
        console.error(\`Failed to preload app \${appName}:\`, error);
      }
    }
  }
  
  // 设置懒加载
  setupLazyLoading() {
    // 监听滚动事件，实现懒加载
    let scrollTimeout;
    
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        this.checkAndLoadVisibleApps();
      }, 100);
    }, { passive: true });
  }
  
  // 检查并加载可见应用
  checkAndLoadVisibleApps() {
    const appContainers = document.querySelectorAll('[data-app-name]:not([data-loaded])');
    
    appContainers.forEach(container => {
      const rect = container.getBoundingClientRect();
      const isVisible = (
        rect.top < window.innerHeight + 200 && // 提前200px加载
        rect.bottom > -200 &&
        rect.left < window.innerWidth + 200 &&
        rect.right > -200
      );
      
      if (isVisible) {
        const appName = container.getAttribute('data-app-name');
        this.loadApp(appName, container);
      }
    });
  }
  
  // 设置可见性处理
  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面不可见时，暂停非关键任务
        this.pauseNonCriticalTasks();
      } else {
        // 页面可见时，恢复任务
        this.resumeTasks();
      }
    });
  }
  
  // 设置网络状态处理
  setupNetworkHandling() {
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.adaptToNetworkConditions();
      });
      
      // 初始适应
      this.adaptToNetworkConditions();
    }
  }
  
  // 适应网络条件
  adaptToNetworkConditions() {
    const connection = navigator.connection;
    
    if (!connection) {
      return;
    }
    
    // 根据网络条件调整加载策略
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      // 慢网络：减少预加载，降低图片质量
      this.appSwitchOptimizer.options.preloadApps = false;
      this.reduceImageQuality();
    } else if (connection.effectiveType === '3g') {
      // 3G网络：适度预加载
      this.appSwitchOptimizer.options.preloadApps = true;
      this.appSwitchOptimizer.options.maxCacheSize = 2;
    } else {
      // 4G/快速网络：积极预加载
      this.appSwitchOptimizer.options.preloadApps = true;
      this.appSwitchOptimizer.options.maxCacheSize = 5;
    }
  }
  
  // 加载应用
  async loadApp(appName, container) {
    const startTime = performance.now();
    
    try {
      // 检查缓存
      const cachedApp = await this.resourceCache.getResource(\`/apps/\${appName}/bundle.js\`);
      
      if (cachedApp) {
        // 从缓存加载
        this.executeAppCode(cachedApp.content, container);
        container.setAttribute('data-loaded', 'true');
        
        const loadTime = performance.now() - startTime;
        this.performanceMonitor.recordAppLoadMetrics(appName, loadTime, true);
        
        console.log(\`Loaded app \${appName} from cache in \${loadTime.toFixed(2)}ms\`);
        return;
      }
      
      // 从网络加载
      const response = await fetch(\`/apps/\${appName}/bundle.js\`);
      const code = await response.text();
      
      // 缓存代码
      await this.resourceCache.cacheResource(\`/apps/\${appName}/bundle.js\`, code, 'text');
      
      // 执行代码
      this.executeAppCode(code, container);
      container.setAttribute('data-loaded', 'true');
      
      const loadTime = performance.now() - startTime;
      this.performanceMonitor.recordAppLoadMetrics(appName, loadTime, true);
      
      console.log(\`Loaded app \${appName} from network in \${loadTime.toFixed(2)}ms\`);
    } catch (error) {
      console.error(\`Failed to load app \${appName}:\`, error);
      
      const loadTime = performance.now() - startTime;
      this.performanceMonitor.recordAppLoadMetrics(appName, loadTime, false);
    }
  }
  
  // 执行应用代码
  executeAppCode(code, container) {
    try {
      // 创建沙箱环境
      const sandbox = new OptimizedSandbox(\`app-\${Date.now()}\`, {
        enablePerformanceMonitoring: true,
        enableLazyProxy: true
      });
      
      sandbox.active();
      
      // 创建执行函数
      const executeApp = new Function('window', 'document', 'container', code);
      executeApp(sandbox.proxyWindow, sandbox.proxyWindow.document, container);
      
      // 保存沙箱引用
      container.sandbox = sandbox;
    } catch (error) {
      console.error('Failed to execute app code:', error);
    }
  }
  
  // 暂停非关键任务
  pauseNonCriticalTasks() {
    // 暂停预加载
    this.appSwitchOptimizer.preloadQueue = [];
    
    // 暂停动画
    document.querySelectorAll('[data-animating]').forEach(el => {
      el.style.animationPlayState = 'paused';
    });
  }
  
  // 恢复任务
  resumeTasks() {
    // 恢复动画
    document.querySelectorAll('[data-animating]').forEach(el => {
      el.style.animationPlayState = 'running';
    });
  }
  
  // 降低图片质量
  reduceImageQuality() {
    document.querySelectorAll('img[data-src]').forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        // 添加低质量参数
        const lowQualitySrc = src.includes('?') 
          ? \`\${src}&quality=low\`
          : \`\${src}?quality=low\`;
        
        img.setAttribute('data-src', lowQualitySrc);
      }
    });
  }
  
  // 获取性能报告
  getPerformanceReport() {
    return {
      performanceSummary: this.performanceMonitor.getPerformanceSummary(),
      cacheStats: this.resourceCache.getCacheStats(),
      appSwitchMetrics: this.appSwitchOptimizer.getPerformanceMetrics()
    };
  }
}

// 使用示例
const platformOptimizer = new EcommercePlatformOptimizer();

// 监听路由变化，切换应用
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substring(1);
  const [appName, ...params] = hash.split('/');
  
  const container = document.getElementById('app-container');
  
  // 切换应用
  platformOptimizer.appSwitchOptimizer.switchApp(
    platformOptimizer.activeApp,
    appName,
    { name: appName, url: \`/apps/\${appName}/index.html\` },
    container
  ).then(() => {
    platformOptimizer.activeApp = appName;
  });
});

// 定期获取性能报告
setInterval(() => {
  const report = platformOptimizer.getPerformanceReport();
  console.log('Performance report:', report);
}, 30000);
\`\`\`

## 最佳实践

### 1. 性能优化最佳实践

1. **资源加载优化**：
   - 使用代码分割和懒加载减少初始加载时间
   - 实现智能预加载策略，提前加载可能需要的资源
   - 使用适当的缓存策略，减少网络请求

2. **应用切换优化**：
   - 实现应用缓存，避免重复加载
   - 优化切换流程，减少切换时间
   - 提供加载状态反馈，改善用户体验

3. **运行时优化**：
   - 优化沙箱实现，减少性能开销
   - 使用代理缓存，提高属性访问效率
   - 合理管理内存，避免内存泄漏

### 2. 性能监控最佳实践

1. **关键指标监控**：
   - 监控应用加载时间、切换时间等关键指标
   - 设置合理的性能阈值，及时发现性能问题
   - 使用采样策略，减少监控开销

2. **用户体验监控**：
   - 监控长任务，避免阻塞主线程
   - 监控内存使用，防止内存泄漏
   - 监控网络状态，适应不同网络条件

3. **数据分析与优化**：
   - 定期分析性能数据，发现性能瓶颈
   - 基于数据驱动优化决策
   - 建立性能基准，跟踪优化效果

## 总结

微前端性能优化与监控是确保微前端系统高效运行的关键环节。本文详细介绍了微前端环境下的性能挑战、优化策略和监控方案，包括资源加载优化、应用切换优化、运行时优化和关键性能指标监控。

通过合理应用这些技术和策略，可以显著提升微前端系统的性能和用户体验。随着微前端技术的不断发展，性能优化和监控方案也将不断演进，为开发者提供更强大、更智能的工具和方法。`;export{n as default};
//# sourceMappingURL=30-CQDGVnDe.js.map
