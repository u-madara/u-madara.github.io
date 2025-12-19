const n=`---
title: 微前端性能优化技术详解（一）- 资源加载与应用切换优化
excerpt: 在微前端架构中，由于需要加载和管理多个独立的应用，性能优化变得尤为重要。本文详细介绍微前端环境下的性能优化技术，包括资源加载优化、应用切换优化等方面。
coverImage: /assets/blog/preview/cover.jpg
date: "2025-11-26"
author:
  name: 前端架构团队
  picture: "/assets/blog/authors/team.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# 微前端性能优化技术详解

## 引言

在微前端架构中，由于需要加载和管理多个独立的应用，性能优化变得尤为重要。本文将详细介绍微前端环境下的性能优化技术，包括资源加载优化、应用切换优化和运行时优化等方面，帮助开发者构建高性能的微前端应用。

## 微前端性能挑战

微前端架构虽然带来了诸多好处，但也引入了一些独特的性能挑战：

1. **资源加载开销**：多个应用意味着更多的JavaScript、CSS和资源文件需要加载
2. **应用切换延迟**：在不同应用间切换时，可能需要加载新应用并卸载旧应用
3. **运行时开销**：沙箱机制和隔离策略会增加运行时性能开销
4. **内存占用**：同时加载多个应用可能导致内存占用增加

## 资源加载性能优化

### 1. 资源加载监控

\`\`\`javascript
// 微前端资源加载监控
class ResourceLoadMonitor {
  constructor(options = {}) {
    this.options = {
      slowLoadThreshold: 3000, // 3秒
      enableWarning: true,
      ...options
    };
    
    this.resourceLoadTimes = new Map();
    this.setupResourceObserver();
  }
  
  // 设置资源观察器
  setupResourceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordResourceLoadTime(entry);
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }
  
  // 记录资源加载时间
  recordResourceLoadTime(entry) {
    const loadTime = entry.responseEnd - entry.startTime;
    this.resourceLoadTimes.set(entry.name, {
      loadTime,
      size: entry.transferSize || 0,
      type: this.getResourceType(entry.name)
    });
    
    // 检查是否加载缓慢
    if (loadTime > this.options.slowLoadThreshold && this.options.enableWarning) {
      console.warn(\`Slow resource detected: \${entry.name} took \${loadTime}ms\`);
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
  
  // 获取资源加载统计
  getResourceLoadStats() {
    const stats = {
      totalResources: this.resourceLoadTimes.size,
      totalTime: 0,
      totalSize: 0,
      byType: {}
    };
    
    this.resourceLoadTimes.forEach((data, url) => {
      stats.totalTime += data.loadTime;
      stats.totalSize += data.size;
      
      if (!stats.byType[data.type]) {
        stats.byType[data.type] = {
          count: 0,
          totalTime: 0,
          totalSize: 0,
          avgTime: 0
        };
      }
      
      stats.byType[data.type].count++;
      stats.byType[data.type].totalTime += data.loadTime;
      stats.byType[data.type].totalSize += data.size;
    });
    
    // 计算平均时间
    Object.keys(stats.byType).forEach(type => {
      const typeStats = stats.byType[type];
      typeStats.avgTime = typeStats.totalTime / typeStats.count;
    });
    
    return stats;
  }
}

// 使用示例
const resourceMonitor = new ResourceLoadMonitor({
  slowLoadThreshold: 2000,
  enableWarning: true
});

// 获取资源加载统计
setTimeout(() => {
  const stats = resourceMonitor.getResourceLoadStats();
  console.log('Resource load stats:', stats);
}, 5000);
\`\`\`

### 2. 应用切换性能优化

\`\`\`javascript
// 微前端应用切换优化
class AppSwitchOptimizer {
  constructor(options = {}) {
    this.options = {
      preloadApps: true,
      cacheApps: true,
      maxCacheSize: 5,
      ...options
    };
    
    this.appCache = new Map();
    this.preloadQueue = [];
    this.switchMetrics = [];
    
    if (this.options.preloadApps) {
      this.setupPreloading();
    }
  }
  
  // 设置预加载
  setupPreloading() {
    // 监听空闲时间，预加载应用
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.processPreloadQueue();
      });
    } else {
      setTimeout(() => {
        this.processPreloadQueue();
      }, 1000);
    }
  }
  
  // 处理预加载队列
  processPreloadQueue() {
    if (this.preloadQueue.length === 0) {
      return;
    }
    
    const appName = this.preloadQueue.shift();
    this.preloadApp(appName);
    
    // 继续处理队列
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.processPreloadQueue();
      });
    } else {
      setTimeout(() => {
        this.processPreloadQueue();
      }, 1000);
    }
  }
  
  // 添加到预加载队列
  queuePreloadApp(appName) {
    if (!this.preloadQueue.includes(appName) && !this.appCache.has(appName)) {
      this.preloadQueue.push(appName);
    }
  }
  
  // 预加载应用
  async preloadApp(appName, appConfig) {
    if (this.appCache.has(appName)) {
      return this.appCache.get(appName);
    }
    
    try {
      const startTime = performance.now();
      
      // 加载应用资源
      const appResources = await this.loadAppResources(appConfig);
      
      // 创建应用实例
      const appInstance = {
        name: appName,
        config: appConfig,
        resources: appResources,
        loadTime: performance.now() - startTime,
        timestamp: Date.now()
      };
      
      // 缓存应用
      if (this.options.cacheApps) {
        this.cacheApp(appName, appInstance);
      }
      
      console.log(\`Preloaded app: \${appName} in \${appInstance.loadTime.toFixed(2)}ms\`);
      return appInstance;
    } catch (error) {
      console.error(\`Failed to preload app \${appName}:\`, error);
      throw error;
    }
  }
  
  // 加载应用资源
  async loadAppResources(appConfig) {
    const resources = {
      scripts: [],
      styles: [],
      images: []
    };
    
    // 加载JavaScript
    if (appConfig.scripts) {
      for (const script of appConfig.scripts) {
        const content = await this.fetchResource(script);
        resources.scripts.push({
          url: script,
          content
        });
      }
    }
    
    // 加载CSS
    if (appConfig.styles) {
      for (const style of appConfig.styles) {
        const content = await this.fetchResource(style);
        resources.styles.push({
          url: style,
          content
        });
      }
    }
    
    return resources;
  }
  
  // 获取资源
  async fetchResource(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`Failed to fetch resource: \${url}\`);
    }
    return await response.text();
  }
  
  // 缓存应用
  cacheApp(appName, appInstance) {
    // 检查缓存大小
    if (this.appCache.size >= this.options.maxCacheSize) {
      // 移除最旧的应用
      const oldestApp = this.appCache.keys().next().value;
      this.appCache.delete(oldestApp);
    }
    
    this.appCache.set(appName, appInstance);
  }
  
  // 切换应用
  async switchApp(fromApp, toApp, toAppConfig, container) {
    const startTime = performance.now();
    
    try {
      // 卸载当前应用
      if (fromApp) {
        await this.unloadApp(fromApp, container);
      }
      
      // 加载或获取目标应用
      let appInstance = this.appCache.get(toApp);
      
      if (!appInstance) {
        appInstance = await this.loadApp(toApp, toAppConfig);
        
        if (this.options.cacheApps) {
          this.cacheApp(toApp, appInstance);
        }
      }
      
      // 挂载新应用
      await this.mountApp(appInstance, container);
      
      const switchTime = performance.now() - startTime;
      
      // 记录切换指标
      this.recordSwitchMetric(fromApp, toApp, switchTime, true);
      
      console.log(\`Switched from \${fromApp || 'null'} to \${toApp} in \${switchTime.toFixed(2)}ms\`);
      
      return appInstance;
    } catch (error) {
      const switchTime = performance.now() - startTime;
      
      // 记录切换指标
      this.recordSwitchMetric(fromApp, toApp, switchTime, false);
      
      console.error(\`Failed to switch from \${fromApp || 'null'} to \${toApp}:\`, error);
      throw error;
    }
  }
  
  // 加载应用
  async loadApp(appName, appConfig) {
    const startTime = performance.now();
    
    try {
      // 加载应用资源
      const appResources = await this.loadAppResources(appConfig);
      
      // 创建应用实例
      const appInstance = {
        name: appName,
        config: appConfig,
        resources: appResources,
        loadTime: performance.now() - startTime,
        timestamp: Date.now()
      };
      
      return appInstance;
    } catch (error) {
      console.error(\`Failed to load app \${appName}:\`, error);
      throw error;
    }
  }
  
  // 卸载应用
  async unloadApp(appName, container) {
    try {
      // 清理容器内容
      container.innerHTML = '';
      
      // 移除事件监听器
      this.removeEventListeners(container);
      
      console.log(\`Unloaded app: \${appName}\`);
    } catch (error) {
      console.error(\`Failed to unload app \${appName}:\`, error);
    }
  }
  
  // 挂载应用
  async mountApp(appInstance, container) {
    try {
      // 添加样式
      for (const style of appInstance.resources.styles) {
        const styleElement = document.createElement('style');
        styleElement.textContent = style.content;
        container.appendChild(styleElement);
      }
      
      // 执行脚本
      for (const script of appInstance.resources.scripts) {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = script.content;
        container.appendChild(scriptElement);
      }
      
      console.log(\`Mounted app: \${appInstance.name}\`);
    } catch (error) {
      console.error(\`Failed to mount app \${appInstance.name}:\`, error);
      throw error;
    }
  }
  
  // 移除事件监听器
  removeEventListeners(container) {
    // 这里需要根据实际情况实现
    // 可以记录添加的事件监听器，然后在卸载时移除
  }
  
  // 记录切换指标
  recordSwitchMetric(fromApp, toApp, switchTime, success) {
    const metric = {
      fromApp,
      toApp,
      switchTime,
      success,
      timestamp: Date.now()
    };
    
    this.switchMetrics.push(metric);
    
    // 限制指标数量
    if (this.switchMetrics.length > 100) {
      this.switchMetrics.shift();
    }
  }
  
  // 获取切换性能指标
  getPerformanceMetrics() {
    if (this.switchMetrics.length === 0) {
      return null;
    }
    
    const successfulSwitches = this.switchMetrics.filter(m => m.success);
    const totalSwitchTime = successfulSwitches.reduce((sum, m) => sum + m.switchTime, 0);
    const avgSwitchTime = totalSwitchTime / successfulSwitches.length;
    
    return {
      totalSwitches: this.switchMetrics.length,
      successfulSwitches: successfulSwitches.length,
      successRate: successfulSwitches.length / this.switchMetrics.length,
      avgSwitchTime,
      minSwitchTime: Math.min(...successfulSwitches.map(m => m.switchTime)),
      maxSwitchTime: Math.max(...successfulSwitches.map(m => m.switchTime))
    };
  }
}

// 使用示例
const appSwitchOptimizer = new AppSwitchOptimizer({
  preloadApps: true,
  cacheApps: true,
  maxCacheSize: 3
});

// 预加载应用
appSwitchOptimizer.queuePreloadApp('app1');
appSwitchOptimizer.queuePreloadApp('app2');

// 切换应用
const container = document.getElementById('app-container');
appSwitchOptimizer.switchApp(
  null, 
  'app1', 
  { 
    name: 'app1',
    scripts: ['/apps/app1/main.js'],
    styles: ['/apps/app1/styles.css']
  },
  container
).then(() => {
  console.log('App 1 loaded');
  
  // 切换到应用2
  return appSwitchOptimizer.switchApp(
    'app1',
    'app2',
    {
      name: 'app2',
      scripts: ['/apps/app2/main.js'],
      styles: ['/apps/app2/styles.css']
    },
    container
  );
}).then(() => {
  console.log('App 2 loaded');
  
  // 获取性能指标
  const metrics = appSwitchOptimizer.getPerformanceMetrics();
  console.log('Switch performance metrics:', metrics);
});
\`\`\`

## 性能优化策略

### 1. 资源优化

#### 代码分割与懒加载

\`\`\`javascript
// 微前端代码分割与懒加载
class MicroFrontendCodeSplitter {
  constructor(options = {}) {
    this.options = {
      enableIntersectionObserver: true,
      rootMargin: '200px',
      threshold: 0.1,
      ...options
    };
    
    this.chunks = new Map();
    this.loadedChunks = new Set();
    this.intersectionObserver = null;
    this.loadStats = {
      totalChunks: 0,
      loadedChunks: 0,
      totalSize: 0,
      totalLoadTime: 0
    };
    
    if (this.options.enableIntersectionObserver && 'IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    }
  }
  
  // 设置交叉观察器
  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const chunkName = entry.target.getAttribute('data-chunk');
          if (chunkName) {
            this.loadChunk(chunkName);
          }
        }
      });
    }, {
      rootMargin: this.options.rootMargin,
      threshold: this.options.threshold
    });
  }
  
  // 代码分割
  splitAppCode(appName, chunks) {
    this.loadStats.totalChunks += chunks.length;
    
    chunks.forEach(chunk => {
      this.chunks.set(chunk.name, {
        name: chunk.name,
        url: chunk.url,
        size: chunk.size || 0,
        dependencies: chunk.dependencies || [],
        loaded: false,
        loadTime: 0
      });
    });
    
    console.log(\`Split app \${appName} into \${chunks.length} chunks\`);
  }
  
  // 加载代码块
  async loadChunk(chunkName) {
    if (this.loadedChunks.has(chunkName)) {
      return;
    }
    
    const chunk = this.chunks.get(chunkName);
    if (!chunk) {
      throw new Error(\`Chunk not found: \${chunkName}\`);
    }
    
    // 先加载依赖
    if (chunk.dependencies.length > 0) {
      await Promise.all(
        chunk.dependencies.map(dep => this.loadChunk(dep))
      );
    }
    
    const startTime = performance.now();
    
    try {
      // 加载代码块
      const response = await fetch(chunk.url);
      if (!response.ok) {
        throw new Error(\`Failed to load chunk: \${chunkName}\`);
      }
      
      const code = await response.text();
      
      // 执行代码
      this.executeChunkCode(chunkName, code);
      
      // 更新状态
      chunk.loaded = true;
      chunk.loadTime = performance.now() - startTime;
      this.loadedChunks.add(chunkName);
      
      // 更新统计
      this.loadStats.loadedChunks++;
      this.loadStats.totalSize += chunk.size;
      this.loadStats.totalLoadTime += chunk.loadTime;
      
      console.log(\`Loaded chunk: \${chunkName} in \${chunk.loadTime.toFixed(2)}ms\`);
    } catch (error) {
      console.error(\`Failed to load chunk \${chunkName}:\`, error);
      throw error;
    }
  }
  
  // 获取代码块
  getChunk(chunkName) {
    return this.chunks.get(chunkName);
  }
  
  // 执行代码块
  executeChunkCode(chunkName, code) {
    try {
      // 创建一个安全的执行环境
      const executeCode = new Function('chunkName', code);
      executeCode(chunkName);
    } catch (error) {
      console.error(\`Failed to execute chunk \${chunkName}:\`, error);
      throw error;
    }
  }
  
  // 预加载代码块
  preloadChunk(chunkName) {
    if (this.loadedChunks.has(chunkName)) {
      return;
    }
    
    const chunk = this.chunks.get(chunkName);
    if (!chunk) {
      throw new Error(\`Chunk not found: \${chunkName}\`);
    }
    
    // 使用低优先级预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.loadChunk(chunkName);
      });
    } else {
      setTimeout(() => {
        this.loadChunk(chunkName);
      }, 100);
    }
  }
  
  // 空闲时预加载
  preloadIdleChunks(chunkNames) {
    if (!('requestIdleCallback' in window)) {
      return;
    }
    
    let index = 0;
    
    const preloadNextChunk = (deadline) => {
      while (deadline.timeRemaining() > 0 && index < chunkNames.length) {
        const chunkName = chunkNames[index++];
        this.preloadChunk(chunkName);
      }
      
      if (index < chunkNames.length) {
        requestIdleCallback(preloadNextChunk);
      }
    };
    
    requestIdleCallback(preloadNextChunk);
  }
  
  // 注册懒加载元素
  registerLazyElement(element, chunkName) {
    element.setAttribute('data-chunk', chunkName);
    
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    } else {
      // 回退方案：立即加载
      this.loadChunk(chunkName);
    }
  }
  
  // 获取加载统计
  getLoadStats() {
    return {
      ...this.loadStats,
      loadedPercentage: (this.loadStats.loadedChunks / this.loadStats.totalChunks) * 100,
      avgLoadTime: this.loadStats.loadedChunks > 0 
        ? this.loadStats.totalLoadTime / this.loadStats.loadedChunks 
        : 0
    };
  }
}

// 使用示例
const codeSplitter = new MicroFrontendCodeSplitter({
  enableIntersectionObserver: true,
  rootMargin: '100px'
});

// 分割应用代码
codeSplitter.splitAppCode('my-app', [
  {
    name: 'my-app-chunk-0',
    url: '/chunks/my-app-chunk-0.js',
    size: 15000,
    dependencies: []
  },
  {
    name: 'my-app-chunk-1',
    url: '/chunks/my-app-chunk-1.js',
    size: 25000,
    dependencies: ['my-app-chunk-0']
  },
  {
    name: 'my-app-chunk-2',
    url: '/chunks/my-app-chunk-2.js',
    size: 20000,
    dependencies: ['my-app-chunk-0']
  }
]);

// 注册懒加载元素
const lazyElement = document.getElementById('lazy-content');
codeSplitter.registerLazyElement(lazyElement, 'my-app-chunk-1');

// 预加载关键代码块
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

## 总结

微前端性能优化是确保微前端系统高效运行的关键环节。本文详细介绍了微前端环境下的性能挑战和优化策略，包括资源加载优化、应用切换优化和运行时优化等方面。

通过合理应用这些技术和策略，可以显著提升微前端系统的性能和用户体验。在实际项目中，开发者应根据具体需求选择合适的优化方案，并持续监控和优化性能表现。随着微前端技术的不断发展，性能优化方案也将不断演进，为开发者提供更强大、更智能的工具和方法。`;export{n as default};
//# sourceMappingURL=30-1-B5OrRBAf.js.map
