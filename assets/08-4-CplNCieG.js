const n=`---
title: "JavaScript性能监控与分析"
excerpt: "深入探讨JavaScript性能监控与分析技术，帮助开发者识别性能瓶颈、收集性能指标并分析性能数据，持续优化应用性能"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-09-02"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
categories: ["JavaScript"]
---

# JavaScript性能监控与分析

## 引言

在之前的文章中，我们探讨了JavaScript内存管理、性能优化技巧和高级优化技术。本文将深入探讨性能监控与分析技术，帮助开发者识别性能瓶颈、收集性能指标并分析性能数据。通过有效的性能监控，开发者可以持续优化应用性能，提供更好的用户体验。

## 5. 性能监控与分析

### 5.1 性能指标收集

\`\`\`javascript
// 1. Web性能指标收集器
class WebPerformanceMetrics {
  constructor() {
    this.metrics = {};
    this.observers = new Map();
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.initMetricsCollection();
    }
  }
  
  // 检查浏览器支持
  checkSupport() {
    return (
      'performance' in window &&
      'PerformanceObserver' in window &&
      'PerformanceNavigationTiming' in window
    );
  }
  
  // 初始化指标收集
  initMetricsCollection() {
    // 收集基本导航指标
    this.collectNavigationMetrics();
    
    // 设置性能观察器
    this.setupObservers();
    
    // 收集资源指标
    this.collectResourceMetrics();
    
    // 收集长任务指标
    this.collectLongTaskMetrics();
    
    // 收集布局偏移指标
    this.collectLayoutShiftMetrics();
    
    // 收集首次输入延迟指标
    this.collectFirstInputDelayMetrics();
  }
  
  // 收集导航指标
  collectNavigationMetrics() {
    const navigationEntries = performance.getEntriesByType('navigation');
    
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      
      this.metrics.navigation = {
        // DNS查询时间
        dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
        
        // TCP连接时间
        tcpConnection: nav.connectEnd - nav.connectStart,
        
        // SSL连接时间
        sslConnection: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
        
        // 请求响应时间
        requestResponse: nav.responseEnd - nav.requestStart,
        
        // DOM解析时间
        domParsing: nav.domContentLoadedEventEnd - nav.domLoading,
        
        // 资源加载时间
        resourceLoading: nav.loadEventEnd - nav.domContentLoadedEventEnd,
        
        // 首字节时间
        firstByte: nav.responseStart - nav.requestStart,
        
        // 首次内容绘制
        firstContentfulPaint: this.getMetricValue('first-contentful-paint'),
        
        // 首次绘制
        firstPaint: this.getMetricValue('first-paint'),
        
        // 最大内容绘制
        largestContentfulPaint: this.getMetricValue('largest-contentful-paint'),
        
        // 首次输入延迟
        firstInputDelay: this.getMetricValue('first-input-delay'),
        
        // 累积布局偏移
        cumulativeLayoutShift: this.getMetricValue('cumulative-layout-shift'),
        
        // 总页面加载时间
        pageLoadTime: nav.loadEventEnd - nav.navigationStart,
        
        // 交互时间
        timeToInteractive: this.calculateTimeToInteractive()
      };
    }
  }
  
  // 设置性能观察器
  setupObservers() {
    // 首次内容绘制观察器
    this.setupObserver('paint', (entryList) => {
      for (const entry of entryList.getEntries()) {
        this.metrics[entry.name] = entry.startTime;
      }
    });
    
    // 最大内容绘制观察器
    this.setupObserver('largest-contentful-paint', (entryList) => {
      const lastEntry = entryList.getEntries().pop();
      if (lastEntry) {
        this.metrics.largestContentfulPaint = lastEntry.startTime;
      }
    });
    
    // 首次输入延迟观察器
    this.setupObserver('first-input', (entryList) => {
      for (const entry of entryList.getEntries()) {
        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
      }
    });
    
    // 布局偏移观察器
    this.setupObserver('layout-shift', (entryList) => {
      let layoutShiftSum = 0;
      
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          layoutShiftSum += entry.value;
        }
      }
      
      this.metrics.cumulativeLayoutShift = 
        (this.metrics.cumulativeLayoutShift || 0) + layoutShiftSum;
    });
    
    // 长任务观察器
    this.setupObserver('longtask', (entryList) => {
      if (!this.metrics.longTasks) {
        this.metrics.longTasks = [];
      }
      
      for (const entry of entryList.getEntries()) {
        this.metrics.longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime
        });
      }
    });
  }
  
  // 设置观察器
  setupObserver(type, callback) {
    try {
      const observer = new PerformanceObserver(callback);
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      console.error(\`Error setting up \${type} observer:\`, error);
    }
  }
  
  // 收集资源指标
  collectResourceMetrics() {
    const resourceEntries = performance.getEntriesByType('resource');
    
    this.metrics.resources = resourceEntries.map(entry => ({
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || 0,
      startTime: entry.startTime,
      responseEnd: entry.responseEnd
    }));
    
    // 按类型分组资源
    this.metrics.resourcesByType = this.groupResourcesByType(this.metrics.resources);
  }
  
  // 收集长任务指标
  collectLongTaskMetrics() {
    if (this.metrics.longTasks) {
      this.metrics.totalBlockingTime = this.metrics.longTasks
        .filter(task => task.duration > 50)
        .reduce((sum, task) => sum + (task.duration - 50), 0);
    }
  }
  
  // 收集布局偏移指标
  collectLayoutShiftMetrics() {
    // 已在setupObservers中处理
  }
  
  // 收集首次输入延迟指标
  collectFirstInputDelayMetrics() {
    // 已在setupObservers中处理
  }
  
  // 获取指标值
  getMetricValue(name) {
    return this.metrics[name] || 0;
  }
  
  // 获取资源类型
  getResourceType(url) {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    
    const typeMap = {
      'js': 'script',
      'css': 'stylesheet',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'webp': 'image',
      'woff': 'font',
      'woff2': 'font',
      'ttf': 'font',
      'eot': 'font'
    };
    
    return typeMap[extension] || 'other';
  }
  
  // 按类型分组资源
  groupResourcesByType(resources) {
    const grouped = {};
    
    for (const resource of resources) {
      if (!grouped[resource.type]) {
        grouped[resource.type] = [];
      }
      
      grouped[resource.type].push(resource);
    }
    
    // 计算每种类型的统计信息
    for (const type in grouped) {
      const typeResources = grouped[type];
      const totalSize = typeResources.reduce((sum, r) => sum + r.size, 0);
      const totalDuration = typeResources.reduce((sum, r) => sum + r.duration, 0);
      
      grouped[type] = {
        count: typeResources.length,
        totalSize,
        totalDuration,
        averageSize: totalSize / typeResources.length,
        averageDuration: totalDuration / typeResources.length,
        resources: typeResources
      };
    }
    
    return grouped;
  }
  
  // 计算交互时间
  calculateTimeToInteractive() {
    // 这是一个简化实现，实际计算更复杂
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = this.metrics.firstContentfulPaint || 0;
    const domContentLoaded = nav.domContentLoadedEventEnd;
    
    // 简化计算：取DOM加载完成时间和FCP之后的较晚时间
    return Math.max(domContentLoaded, fcp);
  }
  
  // 获取所有指标
  getMetrics() {
    return this.metrics;
  }
  
  // 生成性能报告
  generateReport() {
    const report = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      performanceScore: this.calculatePerformanceScore()
    };
    
    return report;
  }
  
  // 计算性能得分
  calculatePerformanceScore() {
    // 简化的性能得分计算
    let score = 100;
    
    // FCP得分
    const fcp = this.metrics.firstContentfulPaint || 0;
    if (fcp > 3000) score -= 20;
    else if (fcp > 2000) score -= 10;
    
    // LCP得分
    const lcp = this.metrics.largestContentfulPaint || 0;
    if (lcp > 4000) score -= 20;
    else if (lcp > 2500) score -= 10;
    
    // FID得分
    const fid = this.metrics.firstInputDelay || 0;
    if (fid > 300) score -= 20;
    else if (fid > 100) score -= 10;
    
    // CLS得分
    const cls = this.metrics.cumulativeLayoutShift || 0;
    if (cls > 0.25) score -= 20;
    else if (cls > 0.1) score -= 10;
    
    // TBT得分
    const tbt = this.metrics.totalBlockingTime || 0;
    if (tbt > 600) score -= 20;
    else if (tbt > 300) score -= 10;
    
    return Math.max(0, score);
  }
}

// 2. 自定义性能监控器
class CustomPerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
    this.timers = new Map();
    this.observers = new Map();
  }
  
  // 标记性能点
  mark(name) {
    const markName = \`mark-\${name}\`;
    performance.mark(markName);
    this.marks.set(name, {
      name: markName,
      timestamp: performance.now()
    });
  }
  
  // 测量性能间隔
  measure(name, startMark, endMark) {
    const startMarkName = \`mark-\${startMark}\`;
    const endMarkName = endMark ? \`mark-\${endMark}\` : undefined;
    
    if (!endMark) {
      performance.mark(\`measure-end-\${name}\`);
      performance.measure(name, startMarkName, \`measure-end-\${name}\`);
    } else {
      performance.measure(name, startMarkName, endMarkName);
    }
    
    const entries = performance.getEntriesByName(name, 'measure');
    const lastEntry = entries[entries.length - 1];
    
    this.measures.set(name, {
      name,
      duration: lastEntry.duration,
      startTime: lastEntry.startTime
    });
    
    return lastEntry.duration;
  }
  
  // 开始计时器
  startTimer(name) {
    this.timers.set(name, performance.now());
  }
  
  // 结束计时器
  endTimer(name) {
    const startTime = this.timers.get(name);
    if (!startTime) {
      throw new Error(\`Timer "\${name}" not started\`);
    }
    
    const duration = performance.now() - startTime;
    this.timers.set(name, duration);
    
    return duration;
  }
  
  // 获取计时器结果
  getTimer(name) {
    return this.timers.get(name);
  }
  
  // 测量函数执行时间
  async measureFunction(name, fn, isAsync = false) {
    this.mark(\`\${name}-start\`);
    
    try {
      let result;
      
      if (isAsync) {
        result = await fn();
      } else {
        result = fn();
      }
      
      this.mark(\`\${name}-end\`);
      const duration = this.measure(name, \`\${name}-start\`, \`\${name}-end\`);
      
      return {
        result,
        duration
      };
    } catch (error) {
      this.mark(\`\${name}-error\`);
      const duration = this.measure(name, \`\${name}-start\`, \`\${name}-error\`);
      
      throw {
        error,
        duration
      };
    }
  }
  
  // 观察性能指标
  observe(type, callback) {
    if (!this.observers.has(type)) {
      try {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          callback(entries);
        });
        
        observer.observe({ type, buffered: true });
        this.observers.set(type, observer);
      } catch (error) {
        console.error(\`Error observing \${type}:\`, error);
      }
    }
  }
  
  // 获取所有标记
  getMarks() {
    return Array.from(this.marks.entries()).map(([name, mark]) => ({
      name,
      timestamp: mark.timestamp
    }));
  }
  
  // 获取所有测量
  getMeasures() {
    return Array.from(this.measures.entries()).map(([name, measure]) => ({
      name,
      duration: measure.duration,
      startTime: measure.startTime
    }));
  }
  
  // 获取所有计时器
  getTimers() {
    return Array.from(this.timers.entries()).map(([name, timer]) => ({
      name,
      duration: typeof timer === 'number' ? timer : performance.now() - timer
    }));
  }
  
  // 清除所有标记
  clearMarks() {
    for (const [name, mark] of this.marks) {
      performance.clearMarks(mark.name);
    }
    this.marks.clear();
  }
  
  // 清除所有测量
  clearMeasures() {
    for (const [name] of this.measures) {
      performance.clearMeasures(name);
    }
    this.measures.clear();
  }
  
  // 清除所有计时器
  clearTimers() {
    this.timers.clear();
  }
  
  // 生成性能报告
  generateReport() {
    return {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      marks: this.getMarks(),
      measures: this.getMeasures(),
      timers: this.getTimers()
    };
  }
}

// 3. 内存监控器
class MemoryMonitor {
  constructor() {
    this.isSupported = 'memory' in performance;
    this.measurements = [];
    this.observers = new Map();
    this.maxMeasurements = 100;
    
    if (this.isSupported) {
      this.startMonitoring();
    }
  }
  
  // 开始监控
  startMonitoring() {
    // 立即收集一次内存信息
    this.collectMemoryInfo();
    
    // 定期收集内存信息
    this.intervalId = setInterval(() => {
      this.collectMemoryInfo();
    }, 5000); // 每5秒收集一次
    
    // 监控内存压力
    this.monitorMemoryPressure();
  }
  
  // 停止监控
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // 断开所有观察者
    for (const [type, observer] of this.observers) {
      observer.disconnect();
    }
    this.observers.clear();
  }
  
  // 收集内存信息
  collectMemoryInfo() {
    if (!this.isSupported) return;
    
    const memory = performance.memory;
    const measurement = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
    
    this.measurements.push(measurement);
    
    // 限制测量数量
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }
    
    return measurement;
  }
  
  // 监控内存压力
  monitorMemoryPressure() {
    if ('memoryPressure' in window) {
      const observer = new window.memoryPressure((event) => {
        this.handleMemoryPressure(event);
      });
      
      observer.observe();
      this.observers.set('memoryPressure', observer);
    }
  }
  
  // 处理内存压力
  handleMemoryPressure(event) {
    console.warn('Memory pressure detected:', event);
    
    // 触发内存清理
    this.triggerMemoryCleanup();
  }
  
  // 触发内存清理
  triggerMemoryCleanup() {
    // 发送自定义事件，通知应用进行内存清理
    const event = new CustomEvent('memoryCleanup', {
      detail: {
        timestamp: Date.now(),
        memoryUsage: this.getCurrentMemoryUsage()
      }
    });
    
    window.dispatchEvent(event);
  }
  
  // 获取当前内存使用情况
  getCurrentMemoryUsage() {
    if (!this.isSupported) return null;
    
    const memory = performance.memory;
    
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  
  // 获取内存使用趋势
  getMemoryTrend(duration = 60000) {
    const now = Date.now();
    const startTime = now - duration;
    
    return this.measurements.filter(m => m.timestamp >= startTime);
  }
  
  // 检测内存泄漏
  detectMemoryLeaks(threshold = 10) {
    if (this.measurements.length < 10) return false;
    
    // 获取最近的测量数据
    const recent = this.measurements.slice(-10);
    
    // 计算内存增长趋势
    const firstMeasurement = recent[0];
    const lastMeasurement = recent[recent.length - 1];
    
    const growthRate = 
      (lastMeasurement.usedJSHeapSize - firstMeasurement.usedJSHeapSize) / 
      firstMeasurement.usedJSHeapSize;
    
    // 如果增长率超过阈值，可能存在内存泄漏
    return growthRate > (threshold / 100);
  }
  
  // 获取内存使用统计
  getMemoryStats() {
    if (this.measurements.length === 0) return null;
    
    const usedSizes = this.measurements.map(m => m.usedJSHeapSize);
    const usagePercentages = this.measurements.map(m => m.usagePercentage);
    
    return {
      current: this.getCurrentMemoryUsage(),
      average: {
        used: usedSizes.reduce((a, b) => a + b, 0) / usedSizes.length,
        usage: usagePercentages.reduce((a, b) => a + b, 0) / usagePercentages.length
      },
      max: {
        used: Math.max(...usedSizes),
        usage: Math.max(...usagePercentages)
      },
      min: {
        used: Math.min(...usedSizes),
        usage: Math.min(...usagePercentages)
      },
      leakDetected: this.detectMemoryLeaks()
    };
  }
  
  // 生成内存报告
  generateMemoryReport() {
    return {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      isSupported: this.isSupported,
      currentUsage: this.getCurrentMemoryUsage(),
      stats: this.getMemoryStats(),
      trend: this.getMemoryTrend(),
      measurements: this.measurements
    };
  }
}
\`\`\`

## 结论

性能监控与分析是优化JavaScript应用性能的关键环节。通过本文介绍的性能指标收集、自定义性能监控和内存监控技术，开发者可以全面了解应用性能状况，及时发现和解决性能问题。在下一篇文章中，我们将探讨JavaScript性能优化的未来趋势与展望。`;export{n as default};
//# sourceMappingURL=08-4-CplNCieG.js.map
