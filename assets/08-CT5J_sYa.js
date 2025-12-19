const n=`---
title: "JavaScript内存管理与性能优化"
excerpt: "深入探讨JavaScript内存管理机制、垃圾回收算法、内存泄漏检测与预防，以及各种性能优化技巧，帮助开发者构建高性能、低内存消耗的JavaScript应用"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-09-05"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# JavaScript内存管理与性能优化

## 引言

JavaScript作为一门高级语言，提供了自动内存管理机制，但这并不意味着开发者可以忽视内存问题。理解JavaScript内存管理原理、识别内存泄漏、掌握性能优化技巧，是构建高性能Web应用的关键。本文将深入探讨JavaScript内存管理的方方面面，从基础概念到高级优化技巧，帮助开发者全面掌握这一重要领域。

## 1. JavaScript内存管理基础

### 1.1 内存生命周期

JavaScript中的内存生命周期与其他编程语言相似，主要包括三个阶段：

\`\`\`javascript
// 1. 分配内存
let user = {
  name: 'John',
  age: 30,
  hobbies: ['reading', 'coding']
};

// 2. 使用内存（读/写）
console.log(user.name); // 读取
user.age = 31; // 写入
user.hobbies.push('traveling'); // 修改

// 3. 释放内存
user = null; // 解除引用，使对象可被垃圾回收
\`\`\`

JavaScript内存主要分为：
- **栈内存**：存储基本类型值和引用类型的地址
- **堆内存**：存储引用类型值（对象、数组、函数等）

### 1.2 垃圾回收机制

JavaScript使用自动垃圾回收（GC）机制，主要算法包括：

\`\`\`javascript
// 引用计数算法（已废弃）
function referenceCountingDemo() {
  let objA = { name: 'Object A' };
  let objB = { name: 'Object B' };
  
  objA.ref = objB; // objB引用计数+1
  objB.ref = objA; // objA引用计数+1
  
  // 循环引用问题
  objA = null; // objA引用计数-1，但仍为1（被objB引用）
  objB = null; // objB引用计数-1，但仍为1（被objA引用）
  
  // 这两个对象无法被回收，导致内存泄漏
}

// 标记清除算法（现代JS引擎使用）
function markAndSweepDemo() {
  let obj1 = { name: 'Object 1' };
  let obj2 = { name: 'Object 2' };
  
  // 创建从根对象可访问的对象链
  let root = { child: obj1 };
  obj1.sibling = obj2;
  
  // 断开从根对象的引用
  root = null;
  
  // 垃圾回收时：
  // 1. 标记阶段：从根对象开始，标记所有可达对象
  // 2. 清除阶段：清除所有未标记的对象
  // obj1和obj2将不可达，被回收
}

// 分代回收策略
function generationalGC() {
  // 大多数对象存活时间短（新生代）
  function createTemporaryObjects() {
    for (let i = 0; i < 1000; i++) {
      let tempObj = { id: i, data: 'temporary' };
      // 这些对象在函数结束后很快被回收
    }
  }
  
  // 少数对象存活时间长（老生代）
  let persistentObj = { 
    data: 'long-lived',
    created: Date.now()
  };
  
  // 新生代：频繁回收，使用Scavenge算法
  // 老生代：低频回收，使用Mark-Sweep/Mark-Compact算法
}
\`\`\`

## 2. 内存泄漏的识别与预防

### 2.1 常见内存泄漏场景

\`\`\`javascript
// 1. 意外的全局变量
function leakGlobalVariables() {
  // 意外创建全局变量
  leakyVar = 'This is a global variable'; // 没有使用var/let/const
  
  // this在全局函数中指向window
  this.anotherLeak = 'Another global variable';
}

// 解决方案：使用严格模式
function noGlobalLeaks() {
  'use strict';
  // leakyVar = 'Error: leakyVar is not defined';
  let localVar = 'This is local';
}

// 2. 闭包中的内存泄漏
function closureLeak() {
  let largeData = new Array(1000000).fill('large data');
  
  // 返回的闭包引用了外部函数的largeData
  return function() {
    // 即使不使用largeData，它仍被闭包引用，无法回收
    return 'Hello';
  };
}

// 解决方案：解除不必要的引用
function noClosureLeak() {
  let largeData = new Array(1000000).fill('large data');
  
  return function() {
    // 使用largeData后解除引用
    let result = largeData.length;
    largeData = null; // 解除引用
    return result;
  };
}

// 3. DOM引用泄漏
function domLeak() {
  const element = document.getElementById('my-element');
  const data = { element: element, info: 'some data' };
  
  // 即使从DOM中移除元素，data.element仍保持引用
  element.remove();
  // 元素无法被垃圾回收，因为data仍在引用它
  
  return data;
}

// 解决方案：清理DOM引用
function noDomLeak() {
  const element = document.getElementById('my-element');
  const data = { element: element, info: 'some data' };
  
  // 清理函数
  function cleanup() {
    data.element = null; // 解除DOM引用
  }
  
  // 在适当的时候调用cleanup
  return { data, cleanup };
}

// 4. 定时器泄漏
function timerLeak() {
  const element = document.getElementById('my-element');
  const largeData = new Array(1000000).fill('data');
  
  // 定时器引用了element和largeData
  setInterval(() => {
    element.textContent = new Date().toLocaleTimeString();
  }, 1000);
  
  // 即使element被移除，定时器仍在运行，largeData也无法回收
}

// 解决方案：清理定时器
function noTimerLeak() {
  const element = document.getElementById('my-element');
  const largeData = new Array(1000000).fill('data');
  
  const intervalId = setInterval(() => {
    if (document.contains(element)) {
      element.textContent = new Date().toLocaleTimeString();
    } else {
      clearInterval(intervalId); // 元素不存在时清理定时器
    }
  }, 1000);
  
  // 返回清理函数
  return function cleanup() {
    clearInterval(intervalId);
  };
}

// 5. 事件监听器泄漏
function eventListenerLeak() {
  const elements = document.querySelectorAll('.item');
  const largeData = new Array(1000000).fill('data');
  
  elements.forEach(element => {
    element.addEventListener('click', () => {
      // 事件处理器引用了外部作用域的largeData
      console.log('Clicked', largeData.length);
    });
  });
  
  // 即使elements被移除，事件监听器仍存在，largeData无法回收
}

// 解决方案：使用事件委托或移除监听器
function noEventListenerLeak() {
  const container = document.getElementById('container');
  const largeData = new Array(1000000).fill('data');
  
  // 使用事件委托，减少监听器数量
  container.addEventListener('click', (event) => {
    if (event.target.classList.contains('item')) {
      console.log('Clicked', largeData.length);
    }
  });
  
  // 或者返回清理函数
  return function cleanup() {
    // 移除所有事件监听器
    container.replaceWith(container.cloneNode(true));
  };
}
\`\`\`

### 2.2 内存泄漏检测工具

\`\`\`javascript
// 使用Chrome DevTools Memory面板检测内存泄漏
class MemoryLeakDetector {
  constructor() {
    this.snapshots = [];
    this.isRecording = false;
  }
  
  // 开始记录
  startRecording() {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.snapshots = [];
    
    // 在DevTools中：Memory面板 -> Take snapshot
    console.log('开始内存分析，请在DevTools中拍摄初始快照');
  }
  
  // 记录操作后的快照
  recordSnapshot(label) {
    if (!this.isRecording) return;
    
    this.snapshots.push({
      label,
      timestamp: Date.now()
    });
    
    // 在DevTools中：Memory面板 -> Take snapshot
    console.log(\`记录快照: \${label}，请在DevTools中拍摄快照\`);
  }
  
  // 比较快照
  compareSnapshots() {
    if (this.snapshots.length < 2) {
      console.error('需要至少2个快照进行比较');
      return;
    }
    
    console.log('请在DevTools中比较快照，查看对象增长情况');
    
    // 在DevTools中：
    // 1. 选择第一个快照
    // 2. 选择"Comparison"视图
    // 3. 选择要比较的快照
    // 4. 查看Delta列，找出增长的对象
  }
  
  // 停止记录
  stopRecording() {
    this.isRecording = false;
    console.log('内存分析完成');
  }
}

// 使用示例
const detector = new MemoryLeakDetector();

detector.startRecording();
// 执行可能泄漏内存的操作
detector.recordSnapshot('操作后');
// 执行更多操作
detector.recordSnapshot('更多操作后');
detector.compareSnapshots();
detector.stopRecording();

// 使用Performance API监控内存使用
class MemoryMonitor {
  constructor() {
    this.measurements = [];
    this.isMonitoring = false;
  }
  
  startMonitoring(interval = 1000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.intervalId = setInterval(() => {
      this.measure();
    }, interval);
  }
  
  measure() {
    if (performance.memory) {
      const measurement = {
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
      
      this.measurements.push(measurement);
      
      // 输出当前内存使用情况
      console.log('内存使用:', {
        used: \`\${(measurement.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB\`,
        total: \`\${(measurement.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB\`,
        limit: \`\${(measurement.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB\`
      });
      
      // 检测内存增长
      if (this.measurements.length > 10) {
        const recent = this.measurements.slice(-10);
        const trend = this.calculateTrend(recent, 'usedJSHeapSize');
        
        if (trend > 0.5) { // 50%增长率阈值
          console.warn('检测到内存快速增长，可能存在内存泄漏');
        }
      }
    } else {
      console.warn('浏览器不支持performance.memory API');
    }
  }
  
  calculateTrend(data, property) {
    if (data.length < 2) return 0;
    
    const first = data[0][property];
    const last = data[data.length - 1][property];
    
    return (last - first) / first;
  }
  
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    clearInterval(this.intervalId);
    this.isMonitoring = false;
  }
  
  getReport() {
    if (this.measurements.length === 0) return null;
    
    const first = this.measurements[0];
    const last = this.measurements[this.measurements.length - 1];
    
    return {
      duration: last.timestamp - first.timestamp,
      memoryGrowth: {
        used: last.usedJSHeapSize - first.usedJSHeapSize,
        total: last.totalJSHeapSize - first.totalJSHeapSize
      },
      averageUsage: this.measurements.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / this.measurements.length
    };
  }
}

// 使用内存监控器
const monitor = new MemoryMonitor();
monitor.startMonitoring(2000); // 每2秒监控一次

// 执行可能泄漏内存的操作...

setTimeout(() => {
  monitor.stopMonitoring();
  console.log('内存报告:', monitor.getReport());
}, 30000);
\`\`\`

## 3. JavaScript性能优化技巧

### 3.1 代码执行优化

\`\`\`javascript
// 1. 循环优化
function loopOptimization() {
  const items = new Array(1000000).fill(0);
  
  // 避免在循环中创建函数
  console.time('Loop with function creation');
  for (let i = 0; i < items.length; i++) {
    items[i] = function() { return i; }; // 每次迭代创建新函数
  }
  console.timeEnd('Loop with function creation');
  
  // 优化：在循环外定义函数
  console.time('Loop with predefined function');
  const createFunction = (index) => () => index;
  for (let i = 0; i < items.length; i++) {
    items[i] = createFunction(i);
  }
  console.timeEnd('Loop with predefined function');
  
  // 避免在循环中访问DOM
  const list = document.getElementById('list');
  
  console.time('Loop with DOM access');
  for (let i = 0; i < 1000; i++) {
    const item = document.createElement('li');
    item.textContent = \`Item \${i}\`;
    list.appendChild(item); // 每次迭代访问DOM
  }
  console.timeEnd('Loop with DOM access');
  
  // 优化：批量DOM操作
  console.time('Loop with batch DOM operations');
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 1000; i++) {
    const item = document.createElement('li');
    item.textContent = \`Item \${i}\`;
    fragment.appendChild(item);
  }
  list.appendChild(fragment); // 一次性添加到DOM
  console.timeEnd('Loop with batch DOM operations');
}

// 2. 函数调用优化
function functionCallOptimization() {
  // 避免深层嵌套调用
  function deepNestedCall(data) {
    return process1(process2(process3(process4(data))));
  }
  
  // 优化：分解为多个步骤
  function optimizedCall(data) {
    const step1 = process4(data);
    const step2 = process3(step1);
    const step3 = process2(step2);
    return process1(step3);
  }
  
  // 避免重复计算
  function expensiveCalculation(x, y) {
    // 每次调用都重新计算
    const result1 = Math.sqrt(x * x + y * y);
    const result2 = Math.sin(x) * Math.cos(y);
    return result1 + result2;
  }
  
  // 优化：缓存计算结果
  const calculationCache = new Map();
  function cachedCalculation(x, y) {
    const key = \`\${x},\${y}\`;
    
    if (calculationCache.has(key)) {
      return calculationCache.get(key);
    }
    
    const result1 = Math.sqrt(x * x + y * y);
    const result2 = Math.sin(x) * Math.cos(y);
    const result = result1 + result2;
    
    calculationCache.set(key, result);
    return result;
  }
}

// 3. 对象和数组操作优化
function objectArrayOptimization() {
  // 对象属性访问优化
  function processUser(user) {
    // 多次访问同一属性
    console.log(user.name);
    console.log(user.age);
    console.log(user.email);
    
    // 优化：缓存属性引用
    const { name, age, email } = user;
    console.log(name);
    console.log(age);
    console.log(email);
  }
  
  // 数组操作优化
  const largeArray = new Array(100000).fill(0).map((_, i) => i);
  
  // 避免在循环中修改数组长度
  console.time('Array length modification in loop');
  for (let i = 0; i < largeArray.length; i++) {
    if (largeArray[i] % 2 === 0) {
      largeArray.splice(i, 1); // 修改数组长度，影响性能
      i--; // 调整索引
    }
  }
  console.timeEnd('Array length modification in loop');
  
  // 优化：创建新数组
  const newArray = new Array(100000).fill(0).map((_, i) => i);
  console.time('Create new array');
  const filteredArray = newArray.filter(item => item % 2 !== 0);
  console.timeEnd('Create new array');
  
  // 使用适当的数据结构
  const list = [];
  for (let i = 0; i < 10000; i++) {
    list.push(i);
  }
  
  // 查找元素 - 数组
  console.time('Array search');
  const arrayContains = list.includes(5000);
  console.timeEnd('Array search');
  
  // 查找元素 - Set
  const set = new Set(list);
  console.time('Set search');
  const setContains = set.has(5000);
  console.timeEnd('Set search');
}
\`\`\`

### 3.2 DOM操作优化

\`\`\`javascript
// 1. 减少DOM重绘和回流
class DOMOptimizer {
  constructor() {
    this.pendingUpdates = new Map();
    this.isUpdateScheduled = false;
  }
  
  // 批量DOM更新
  scheduleUpdate(element, property, value) {
    if (!this.pendingUpdates.has(element)) {
      this.pendingUpdates.set(element, new Map());
    }
    
    this.pendingUpdates.get(element).set(property, value);
    
    if (!this.isUpdateScheduled) {
      this.isUpdateScheduled = true;
      requestAnimationFrame(() => this.applyUpdates());
    }
  }
  
  applyUpdates() {
    for (const [element, updates] of this.pendingUpdates) {
      // 一次性应用所有更新
      for (const [property, value] of updates) {
        element.style[property] = value;
      }
    }
    
    this.pendingUpdates.clear();
    this.isUpdateScheduled = false;
  }
}

// 使用DOM优化器
const domOptimizer = new DOMOptimizer();

// 批量更新样式
const element = document.getElementById('my-element');
domOptimizer.scheduleUpdate(element, 'width', '100px');
domOptimizer.scheduleUpdate(element, 'height', '100px');
domOptimizer.scheduleUpdate(element, 'backgroundColor', 'red');
// 所有更新将在下一个动画帧中一起应用

// 2. 虚拟滚动实现
class VirtualScroller {
  constructor(container, itemHeight, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.visibleItems = [];
    this.scrollTop = 0;
    this.containerHeight = container.clientHeight;
    this.data = [];
    
    this.setupScrollListener();
  }
  
  setData(data) {
    this.data = data;
    this.updateVisibleItems();
  }
  
  setupScrollListener() {
    this.container.addEventListener('scroll', () => {
      this.scrollTop = this.container.scrollTop;
      this.updateVisibleItems();
    });
  }
  
  updateVisibleItems() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(this.containerHeight / this.itemHeight) + 1,
      this.data.length - 1
    );
    
    // 清理不可见的元素
    this.visibleItems.forEach(item => {
      if (item.index < startIndex || item.index > endIndex) {
        item.element.remove();
      }
    });
    
    // 创建或更新可见元素
    this.visibleItems = this.visibleItems.filter(item => 
      item.index >= startIndex && item.index <= endIndex
    );
    
    for (let i = startIndex; i <= endIndex; i++) {
      const existingItem = this.visibleItems.find(item => item.index === i);
      
      if (!existingItem) {
        const element = this.renderItem(this.data[i], i);
        element.style.position = 'absolute';
        element.style.top = \`\${i * this.itemHeight}px\`;
        element.style.height = \`\${this.itemHeight}px\`;
        
        this.container.appendChild(element);
        this.visibleItems.push({ index: i, element });
      }
    }
    
    // 更新容器高度
    this.container.style.height = \`\${this.data.length * this.itemHeight}px\`;
  }
}

// 3. 事件委托优化
class EventDelegation {
  constructor(container) {
    this.container = container;
    this.handlers = new Map();
    this.setupDelegation();
  }
  
  // 注册事件处理器
  on(selector, eventType, handler) {
    const key = \`\${eventType}:\${selector}\`;
    
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    
    this.handlers.get(key).push(handler);
  }
  
  setupDelegation() {
    this.container.addEventListener('click', (event) => {
      const target = event.target;
      
      // 查找匹配的选择器
      for (const [key, handlers] of this.handlers) {
        const [eventType, selector] = key.split(':');
        
        if (eventType === 'click' && target.matches(selector)) {
          handlers.forEach(handler => handler.call(target, event));
        }
      }
    });
  }
}

// 使用事件委托
const container = document.getElementById('container');
const delegation = new EventDelegation(container);

delegation.on('.item', 'click', function(event) {
  console.log('Item clicked:', this.textContent);
});

delegation.on('.delete-btn', 'click', function(event) {
  event.stopPropagation();
  console.log('Delete button clicked');
});
\`\`\`

### 3.3 内存优化技巧

\`\`\`javascript
// 1. 对象池模式
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    
    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
  
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    
    return this.createFn();
  }
  
  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
  
  size() {
    return this.pool.length;
  }
}

// 使用对象池
const vectorPool = new ObjectPool(
  () => ({ x: 0, y: 0, z: 0 }), // 创建函数
  (vec) => { vec.x = 0; vec.y = 0; vec.z = 0; } // 重置函数
);

// 获取对象
const v1 = vectorPool.acquire();
v1.x = 10;
v1.y = 20;
v1.z = 30;

// 使用完后释放
vectorPool.release(v1);

// 2. 弱引用和WeakMap/WeakSet
function weakReferenceExample() {
  // 使用WeakMap存储对象元数据，不影响垃圾回收
  const metadata = new WeakMap();
  
  function attachMetadata(obj, data) {
    metadata.set(obj, data);
  }
  
  function getMetadata(obj) {
    return metadata.get(obj);
  }
  
  // 当obj被垃圾回收时，对应的元数据也会被回收
  let myObj = { id: 1 };
  attachMetadata(myObj, { created: Date.now() });
  
  console.log(getMetadata(myObj)); // { created: ... }
  
  myObj = null; // 解除引用，myObj可被垃圾回收
  // metadata中的对应条目也会被自动清理
  
  // WeakSet用于跟踪对象而不阻止垃圾回收
  const trackedObjects = new WeakSet();
  
  function track(obj) {
    trackedObjects.add(obj);
  }
  
  function isTracked(obj) {
    return trackedObjects.has(obj);
  }
  
  let tempObj = { name: 'temporary' };
  track(tempObj);
  console.log(isTracked(tempObj)); // true
  
  tempObj = null; // tempObj可被垃圾回收，WeakSet中的引用也会被清理
}

// 3. 大数据处理优化
function largeDataOptimization() {
  // 使用数据流处理大文件
  async function processLargeFile(file) {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const stream = file.stream();
    const reader = stream.getReader();
    
    let result = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // 处理每个数据块，而不是一次性加载整个文件
      const chunk = new TextDecoder().decode(value);
      result += processChunk(chunk);
      
      // 让出控制权，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return result;
  }
  
  function processChunk(chunk) {
    // 处理数据块
    return chunk.toUpperCase(); // 示例处理
  }
  
  // 使用Web Workers处理CPU密集型任务
  function processWithWorker(data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker('data-processor.js');
      
      worker.postMessage(data);
      
      worker.onmessage = (event) => {
        resolve(event.data);
        worker.terminate(); // 清理Worker
      };
      
      worker.onerror = (error) => {
        reject(error);
        worker.terminate(); // 清理Worker
      };
    });
  }
  
  // 分批处理大量数据
  async function batchProcess(items, processor, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      
      results.push(...batchResults);
      
      // 让出控制权，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  }
}

// 4. 内存友好的数据结构
function memoryEfficientDataStructures() {
  // 使用TypedArray处理数值数据
  function createTypedArrayExample() {
    // 普通数组：每个元素是对象，占用更多内存
    const normalArray = new Array(1000000);
    for (let i = 0; i < normalArray.length; i++) {
      normalArray[i] = i;
    }
    
    // Int32Array：每个元素32位整数，内存占用更少
    const typedArray = new Int32Array(1000000);
    for (let i = 0; i < typedArray.length; i++) {
      typedArray[i] = i;
    }
    
    console.log('普通数组内存占用:', normalArray.length * 8); // 近似值
    console.log('类型化数组内存占用:', typedArray.byteLength);
  }
  
  // 使用位操作优化布尔值存储
  function booleanOptimization() {
    // 普通布尔数组：每个元素占用更多内存
    const boolArray = new Array(1000).fill(false);
    
    // 位操作：一个32位整数存储32个布尔值
    const bitArray = new Uint32Array(Math.ceil(1000 / 32));
    
    function setBit(array, index, value) {
      const byteIndex = Math.floor(index / 32);
      const bitIndex = index % 32;
      
      if (value) {
        array[byteIndex] |= (1 << bitIndex);
      } else {
        array[byteIndex] &= ~(1 << bitIndex);
      }
    }
    
    function getBit(array, index) {
      const byteIndex = Math.floor(index / 32);
      const bitIndex = index % 32;
      
      return !!(array[byteIndex] & (1 << bitIndex));
    }
    
    // 使用示例
    setBit(bitArray, 500, true);
    console.log('位500的值:', getBit(bitArray, 500));
  }
  
  // 使用Map替代对象作为字典
  function mapVsObject() {
    // 对象作为字典：原型链上的属性可能引起问题
    const dictAsObject = {};
    dictAsObject.toString = 'custom'; // 覆盖原型方法
    
    // Map作为字典：更安全，性能更好
    const dictAsMap = new Map();
    dictAsMap.set('toString', 'custom'); // 安全
    
    // WeakMap：键是对象，不影响垃圾回收
    const weakMap = new WeakMap();
    const obj = { id: 1 };
    weakMap.set(obj, 'metadata');
    
    // 当obj被垃圾回收时，WeakMap中的条目也会被清理
  }
}
\`\`\`

## 4. 高级性能优化技术

### 4.1 渲染性能优化

\`\`\`javascript
// 1. 请求动画帧优化
class AnimationOptimizer {
  constructor() {
    this.animationId = null;
    this.lastTime = 0;
    this.fps = 60;
    this.frameInterval = 1000 / this.fps;
  }
  
  // 节流的动画循环
  animate(callback) {
    const animationLoop = (currentTime) => {
      const deltaTime = currentTime - this.lastTime;
      
      if (deltaTime >= this.frameInterval) {
        this.lastTime = currentTime - (deltaTime % this.frameInterval);
        callback(deltaTime);
      }
      
      this.animationId = requestAnimationFrame(animationLoop);
    };
    
    this.animationId = requestAnimationFrame(animationLoop);
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  // 动态调整FPS
  setTargetFPS(fps) {
    this.fps = fps;
    this.frameInterval = 1000 / fps;
  }
}

// 使用动画优化器
const animator = new AnimationOptimizer();

animator.animate((deltaTime) => {
  // 更新动画状态
  updateAnimation(deltaTime);
  // 渲染
  render();
});

// 2. Canvas渲染优化
class CanvasOptimizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    
    this.setupOffscreenCanvas();
  }
  
  setupOffscreenCanvas() {
    // 设置离屏画布尺寸
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
  }
  
  // 离屏渲染
  renderOffscreen(renderFunction) {
    // 清除离屏画布
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    
    // 在离屏画布上渲染
    renderFunction(this.offscreenCtx);
    
    // 一次性复制到主画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
  }
  
  // 分层渲染
  createLayer(width, height) {
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = width;
    layerCanvas.height = height;
    
    return {
      canvas: layerCanvas,
      ctx: layerCanvas.getContext('2d'),
      clear: () => layerCanvas.getContext('2d').clearRect(0, 0, width, height),
      render: (x = 0, y = 0) => {
        this.ctx.drawImage(layerCanvas, x, y);
      }
    };
  }
  
  // 脏区域渲染
  dirtyRectRendering(objects) {
    const dirtyRegions = [];
    
    // 计算所有对象的脏区域
    objects.forEach(obj => {
      if (obj.isDirty) {
        dirtyRegions.push(obj.getBounds());
        obj.isDirty = false;
      }
    });
    
    // 合并重叠的脏区域
    const mergedRegions = this.mergeDirtyRegions(dirtyRegions);
    
    // 只重绘脏区域
    mergedRegions.forEach(region => {
      this.ctx.clearRect(region.x, region.y, region.width, region.height);
      
      // 找到与该脏区域相交的对象并重绘
      objects.forEach(obj => {
        if (this.intersects(obj.getBounds(), region)) {
          obj.render(this.ctx);
        }
      });
    });
  }
  
  mergeDirtyRegions(regions) {
    // 简化版：实际实现需要更复杂的算法
    return regions;
  }
  
  intersects(rect1, rect2) {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
  }
}

// 3. WebGPU渲染优化（未来方向）
function webGPURendering() {
  // WebGPU提供更底层的GPU控制，性能更高
  async function initWebGPU() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }
    
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const canvas = document.getElementById('webgpu-canvas');
    const context = canvas.getContext('webgpu');
    
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
    });
    
    return { device, context, format };
  }
  
  // 使用WebGPU渲染
  async function renderWithWebGPU() {
    const { device, context, format } = await initWebGPU();
    
    // 创建渲染管线
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: device.createShaderModule({
          code: vertexShaderCode
        }),
        entryPoint: 'main',
      },
      fragment: {
        module: device.createShaderModule({
          code: fragmentShaderCode
        }),
        entryPoint: 'main',
        targets: [{ format }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });
    
    // 渲染循环
    function render() {
      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });
      
      renderPass.setPipeline(pipeline);
      renderPass.draw(3); // 绘制三角形
      renderPass.end();
      
      device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(render);
    }
    
    render();
  }
}
\`\`\`

### 4.2 网络性能优化

\`\`\`javascript
// 1. 资源加载优化
class ResourceLoader {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
  }
  
  // 预加载关键资源
  async preloadCriticalResources(resources) {
    const criticalPromises = resources
      .filter(resource => resource.critical)
      .map(resource => this.loadResource(resource));
    
    await Promise.all(criticalPromises);
  }
  
  // 懒加载非关键资源
  async lazyLoadResource(resource) {
    if ('IntersectionObserver' in window) {
      return new Promise((resolve) => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              observer.unobserve(entry.target);
              this.loadResource(resource).then(resolve);
            }
          });
        });
        
        const element = document.querySelector(resource.selector);
        if (element) {
          observer.observe(element);
        } else {
          // 如果元素不存在，直接加载
          this.loadResource(resource).then(resolve);
        }
      });
    } else {
      // 降级处理
      return this.loadResource(resource);
    }
  }
  
  // 加载资源（带缓存）
  async loadResource(resource) {
    const cacheKey = this.getCacheKey(resource);
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 检查是否正在加载
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }
    
    // 开始加载
    const loadingPromise = this.fetchResource(resource);
    this.loadingPromises.set(cacheKey, loadingPromise);
    
    try {
      const result = await loadingPromise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }
  
  async fetchResource(resource) {
    switch (resource.type) {
      case 'image':
        return this.loadImage(resource.url);
      case 'script':
        return this.loadScript(resource.url);
      case 'style':
        return this.loadStyle(resource.url);
      case 'data':
        return this.fetchData(resource.url);
      default:
        throw new Error(\`Unknown resource type: \${resource.type}\`);
    }
  }
  
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
  
  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = resolve;
      script.onerror = reject;
      script.src = url;
      document.head.appendChild(script);
    });
  }
  
  loadStyle(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.onload = resolve;
      link.onerror = reject;
      link.href = url;
      document.head.appendChild(link);
    });
  }
  
  async fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`Failed to fetch \${url}: \${response.status}\`);
    }
    return response.json();
  }
  
  getCacheKey(resource) {
    return \`\${resource.type}:\${resource.url}\`;
  }
}

// 2. 数据请求优化
class DataRequestOptimizer {
  constructor() {
    this.requestQueue = [];
    this.batchSize = 10;
    this.batchTimeout = 100;
    this.pendingBatch = null;
    this.batchTimer = null;
  }
  
  // 批量请求
  async batchRequest(request) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        request,
        resolve,
        reject
      });
      
      this.scheduleBatch();
    });
  }
  
  scheduleBatch() {
    if (this.pendingBatch) return;
    
    if (this.requestQueue.length >= this.batchSize) {
      this.processBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }
  }
  
  async processBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.requestQueue.length === 0) return;
    
    this.pendingBatch = this.requestQueue.splice(0, this.batchSize);
    
    try {
      const requests = this.pendingBatch.map(item => item.request);
      const results = await this.executeBatchRequest(requests);
      
      this.pendingBatch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      this.pendingBatch.forEach(item => {
        item.reject(error);
      });
    } finally {
      this.pendingBatch = null;
      
      // 如果还有待处理的请求，继续处理
      if (this.requestQueue.length > 0) {
        this.scheduleBatch();
      }
    }
  }
  
  async executeBatchRequest(requests) {
    // 实际实现取决于API设计
    // 这里假设有一个批量请求端点
    const batchPayload = {
      requests: requests.map(req => ({
        method: req.method || 'GET',
        url: req.url,
        data: req.data
      }))
    };
    
    const response = await fetch('/api/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchPayload)
    });
    
    if (!response.ok) {
      throw new Error(\`Batch request failed: \${response.status}\`);
    }
    
    const result = await response.json();
    return result.results;
  }
  
  // 请求去重
  deduplicateRequest(url, options = {}) {
    const key = this.getRequestKey(url, options);
    
    if (!this.activeRequests) {
      this.activeRequests = new Map();
    }
    
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key);
    }
    
    const promise = fetch(url, options)
      .then(response => {
        this.activeRequests.delete(key);
        return response;
      })
      .catch(error => {
        this.activeRequests.delete(key);
        throw error;
      });
    
    this.activeRequests.set(key, promise);
    return promise;
  }
  
  getRequestKey(url, options) {
    return \`\${url}:\${JSON.stringify(options)}\`;
  }
}

// 3. Service Worker缓存策略
class CacheOptimizer {
  constructor() {
    this.cacheName = 'app-cache-v1';
    this.criticalResources = [
      '/',
      '/index.html',
      '/styles/main.css',
      '/scripts/main.js'
    ];
  }
  
  // 注册Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker注册成功:', registration);
      } catch (error) {
        console.error('Service Worker注册失败:', error);
      }
    }
  }
  
  // 缓存策略
  async cacheStrategy(request) {
    const url = new URL(request.url);
    
    // 静态资源：缓存优先
    if (this.isStaticResource(url.pathname)) {
      return this.cacheFirst(request);
    }
    
    // API请求：网络优先
    if (this.isAPIRequest(url.pathname)) {
      return this.networkFirst(request);
    }
    
    // 默认策略：网络优先
    return this.networkFirst(request);
  }
  
  async cacheFirst(request) {
    const cache = await caches.open(this.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      // 返回离线页面或错误页面
      return new Response('Offline', { status: 503 });
    }
  }
  
  async networkFirst(request) {
    try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(this.cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      const cache = await caches.open(this.cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 返回离线页面或错误页面
      return new Response('Offline', { status: 503 });
    }
  }
  
  isStaticResource(pathname) {
    return /\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/.test(pathname);
  }
  
  isAPIRequest(pathname) {
    return pathname.startsWith('/api/');
  }
  
  // 预缓存关键资源
  async precacheCriticalResources() {
    const cache = await caches.open(this.cacheName);
    return cache.addAll(this.criticalResources);
  }
  
  // 后台同步
  async backgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      
      // 注册同步事件
      return registration.sync.register('background-sync');
    }
  }
}
\`\`\`

## 5. 性能监控与分析

### 5.1 性能指标收集

\`\`\`javascript
// 1. 核心Web性能指标
class WebPerformanceMetrics {
  constructor() {
    this.metrics = {};
    this.observers = new Map();
    this.setupObservers();
  }
  
  setupObservers() {
    // 观察Paint Timing API
    if ('PerformanceObserver' in window) {
      this.observePaintTiming();
      this.observeNavigationTiming();
      this.observeResourceTiming();
      this.observeLongTasks();
      this.observeLayoutShift();
    }
  }
  
  observePaintTiming() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-paint') {
          this.metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      }
    });
    
    observer.observe({ entryTypes: ['paint'] });
    this.observers.set('paint', observer);
  }
  
  observeNavigationTiming() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.navigationTiming = {
          domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
          loadComplete: entry.loadEventEnd - entry.loadEventStart,
          domInteractive: entry.domInteractive - entry.navigationStart,
          firstByte: entry.responseStart - entry.requestStart
        };
      }
    });
    
    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('navigation', observer);
  }
  
  observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      const resources = list.getEntries();
      this.metrics.resources = resources.map(resource => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: this.getResourceType(resource.name)
      }));
      
      // 分析资源加载性能
      this.analyzeResourcePerformance();
    });
    
    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }
  
  observeLongTasks() {
    const observer = new PerformanceObserver((list) => {
      const longTasks = list.getEntries();
      this.metrics.longTasks = longTasks.map(task => ({
        duration: task.duration,
        startTime: task.startTime
      }));
      
      // 计算阻塞时间
      this.calculateBlockingTime();
    });
    
    observer.observe({ entryTypes: ['longtask'] });
    this.observers.set('longtask', observer);
  }
  
  observeLayoutShift() {
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      this.metrics.cumulativeLayoutShift = clsValue;
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('layout-shift', observer);
  }
  
  // 计算First Input Delay (FID)
  measureFID() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          observer.disconnect();
          resolve(this.metrics.firstInputDelay);
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    });
  }
  
  // 计算Time to Interactive (TTI)
  async measureTTI() {
    return new Promise((resolve) => {
      // 简化版TTI计算
      // 实际实现需要更复杂的逻辑
      const checkTTI = () => {
        const longTasks = this.metrics.longTasks || [];
        const lastLongTask = longTasks.length > 0 
          ? longTasks[longTasks.length - 1].startTime + longTasks[longTasks.length - 1].duration
          : 0;
        
        const now = performance.now();
        const domContentLoaded = this.metrics.navigationTiming?.domContentLoaded || 0;
        
        const tti = Math.max(lastLongTask, domContentLoaded);
        
        if (now - tti > 5000) { // 5秒内没有长任务
          resolve(tti);
        } else {
          setTimeout(checkTTI, 1000);
        }
      };
      
      checkTTI();
    });
  }
  
  getResourceType(url) {
    const extension = url.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'js': return 'script';
      case 'css': return 'stylesheet';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg': return 'image';
      case 'woff':
      case 'woff2': return 'font';
      default: return 'other';
    }
  }
  
  analyzeResourcePerformance() {
    if (!this.metrics.resources) return;
    
    const resources = this.metrics.resources;
    const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
    const totalDuration = resources.reduce((sum, resource) => sum + resource.duration, 0);
    
    this.metrics.resourceAnalysis = {
      count: resources.length,
      totalSize,
      totalDuration,
      averageSize: totalSize / resources.length,
      averageDuration: totalDuration / resources.length,
      largestResources: resources
        .sort((a, b) => b.size - a.size)
        .slice(0, 5),
      slowestResources: resources
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
    };
  }
  
  calculateBlockingTime() {
    if (!this.metrics.longTasks) return;
    
    this.metrics.totalBlockingTime = this.metrics.longTasks
      .reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0);
  }
  
  // 获取性能报告
  getPerformanceReport() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };
  }
  
  // 发送性能数据
  async sendMetrics(endpoint) {
    const report = this.getPerformanceReport();
    
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('发送性能数据失败:', error);
    }
  }
  
  // 清理观察者
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// 2. 自定义性能监控
class CustomPerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
    this.timers = new Map();
  }
  
  // 标记性能点
  mark(name) {
    performance.mark(name);
    this.marks.set(name, performance.now());
  }
  
  // 测量两个标记之间的时间
  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    this.measures.set(name, measure.duration);
    
    return measure.duration;
  }
  
  // 计时器
  startTimer(name) {
    this.timers.set(name, performance.now());
  }
  
  endTimer(name) {
    if (!this.timers.has(name)) {
      console.warn(\`计时器 \${name} 不存在\`);
      return 0;
    }
    
    const startTime = this.timers.get(name);
    const duration = performance.now() - startTime;
    
    this.timers.delete(name);
    return duration;
  }
  
  // 函数执行时间测量
  measureFunction(fn, name) {
    return function(...args) {
      const start = performance.now();
      const result = fn.apply(this, args);
      const end = performance.now();
      
      console.log(\`\${name} 执行时间: \${end - start}ms\`);
      return result;
    };
  }
  
  // 异步函数执行时间测量
  async measureAsyncFunction(fn, name) {
    return async function(...args) {
      const start = performance.now();
      const result = await fn.apply(this, args);
      const end = performance.now();
      
      console.log(\`\${name} 执行时间: \${end - start}ms\`);
      return result;
    };
  }
  
  // 内存使用监控
  measureMemory() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    
    return null;
  }
  
  // FPS监控
  measureFPS(callback) {
    let lastTime = performance.now();
    let frames = 0;
    
    function countFrames(currentTime) {
      frames++;
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        callback(fps);
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrames);
    }
    
    requestAnimationFrame(countFrames);
  }
  
  // 获取所有测量结果
  getAllMeasures() {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures),
      timers: Object.fromEntries(this.timers)
    };
  }
}
\`\`\`

## 6. 未来趋势与展望

### 6.1 新兴性能优化技术

\`\`\`javascript
// 1. WebAssembly性能优化
class WebAssemblyOptimizer {
  constructor() {
    this.wasmModule = null;
    this.wasmInstance = null;
  }
  
  // 加载WebAssembly模块
  async loadWasmModule(url) {
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    this.wasmModule = await WebAssembly.compile(bytes);
    
    // 创建实例，导入JavaScript函数
    this.wasmInstance = await WebAssembly.instantiate(this.wasmModule, {
      env: {
        // 导入JavaScript函数到WebAssembly
        log: (value) => console.log('WASM Log:', value),
        random: () => Math.random(),
        now: () => Date.now()
      }
    });
    
    return this.wasmInstance;
  }
  
  // 使用WebAssembly进行CPU密集型计算
  async performHeavyCalculation(data) {
    if (!this.wasmInstance) {
      throw new Error('WebAssembly模块未加载');
    }
    
    // 将JavaScript数据传递到WebAssembly内存
    const dataPtr = this.allocateArray(data);
    
    // 调用WebAssembly函数
    const resultPtr = this.wasmInstance.exports.process_data(dataPtr, data.length);
    
    // 从WebAssembly内存中读取结果
    const result = this.readArray(resultPtr);
    
    // 释放内存
    this.freeArray(dataPtr);
    this.freeArray(resultPtr);
    
    return result;
  }
  
  allocateArray(data) {
    const size = data.length * Float64Array.BYTES_PER_ELEMENT;
    const ptr = this.wasmInstance.exports.malloc(size);
    
    const wasmArray = new Float64Array(
      this.wasmInstance.exports.memory.buffer,
      ptr,
      data.length
    );
    
    wasmArray.set(data);
    return ptr;
  }
  
  readArray(ptr, length) {
    const wasmArray = new Float64Array(
      this.wasmInstance.exports.memory.buffer,
      ptr,
      length
    );
    
    return Array.from(wasmArray);
  }
  
  freeArray(ptr) {
    this.wasmInstance.exports.free(ptr);
  }
}

// 2. WebCodecs API性能优化
class WebCodecsOptimizer {
  constructor() {
    this.decoder = null;
    this.encoder = null;
  }
  
  // 高效视频解码
  async setupVideoDecoder(config) {
    this.decoder = new VideoDecoder({
      output: (frame) => {
        // 处理解码后的视频帧
        this.processVideoFrame(frame);
      },
      error: (error) => {
        console.error('视频解码错误:', error);
      }
    });
    
    this.decoder.configure(config);
  }
  
  // 高效视频编码
  async setupVideoEncoder(config) {
    this.encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        // 处理编码后的视频数据
        this.processEncodedChunk(chunk, metadata);
      },
      error: (error) => {
        console.error('视频编码错误:', error);
      }
    });
    
    this.encoder.configure(config);
  }
  
  // 处理视频帧
  processVideoFrame(frame) {
    // 可以将帧渲染到Canvas或进行其他处理
    const canvas = document.getElementById('video-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = frame.displayWidth;
    canvas.height = frame.displayHeight;
    ctx.drawImage(frame, 0, 0);
    
    frame.close(); // 释放帧资源
  }
  
  // 处理编码后的数据
  processEncodedChunk(chunk, metadata) {
    // 可以发送到服务器或存储
    console.log('编码完成:', chunk, metadata);
  }
  
  // 编码Canvas内容
  encodeCanvasFrame(canvas) {
    const frame = new VideoFrame(canvas, {
      timestamp: performance.now() * 1000 // 微秒
    });
    
    this.encoder.encode(frame);
    frame.close();
  }
}

// 3. WebGPU计算优化
class WebGPUComputeOptimizer {
  async initWebGPU() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }
    
    const adapter = await navigator.gpu.requestAdapter();
    this.device = await adapter.requestDevice();
    
    return this.device;
  }
  
  // 使用WebGPU进行并行计算
  async performParallelCompute(data, shaderCode) {
    // 创建计算管线
    const pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.device.createShaderModule({
          code: shaderCode
        }),
        entryPoint: 'main',
      },
    });
    
    // 创建缓冲区
    const inputBuffer = this.device.createBuffer({
      size: data.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    
    const outputBuffer = this.device.createBuffer({
      size: data.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    
    const stagingBuffer = this.device.createBuffer({
      size: data.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    
    // 写入输入数据
    this.device.queue.writeBuffer(inputBuffer, 0, new Float32Array(data));
    
    // 创建绑定组
    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: inputBuffer },
        },
        {
          binding: 1,
          resource: { buffer: outputBuffer },
        },
      ],
    });
    
    // 执行计算
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(data.length / 64));
    passEncoder.end();
    
    // 复制结果到staging缓冲区
    commandEncoder.copyBufferToBuffer(
      outputBuffer, 0, stagingBuffer, 0, 
      data.length * Float32Array.BYTES_PER_ELEMENT
    );
    
    this.device.queue.submit([commandEncoder.finish()]);
    
    // 读取结果
    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const resultArray = new Float32Array(
      stagingBuffer.getMappedRange()
    );
    
    const result = Array.from(resultArray);
    stagingBuffer.unmap();
    
    return result;
  }
}
\`\`\`

## 结论

JavaScript内存管理与性能优化是一个复杂而重要的领域，它直接影响着Web应用的用户体验和资源利用效率。通过深入理解JavaScript内存管理机制、识别和预防内存泄漏、掌握各种性能优化技巧，开发者可以构建出更高效、更可靠的Web应用。

随着Web平台的不断发展，新的API和技术（如WebAssembly、WebGPU、WebCodecs等）为性能优化提供了更多可能性。同时，浏览器厂商也在不断改进垃圾回收算法和渲染引擎，为开发者提供更好的性能基础。

作为前端开发者，我们应该持续关注性能优化的最佳实践，结合实际项目需求，选择合适的优化策略。记住，性能优化不是一次性的工作，而是一个持续的过程，需要我们不断地测量、分析和改进。

通过掌握本文介绍的技术和方法，您将能够更好地应对JavaScript开发中的内存管理和性能挑战，为用户提供更流畅、更高效的Web体验。`;export{n as default};
//# sourceMappingURL=08-CT5J_sYa.js.map
