const n=`---
title: "JavaScript性能优化技巧"
excerpt: "深入探讨JavaScript性能优化技巧，包括代码执行优化、DOM操作优化和内存优化等方面，帮助开发者提升Web应用的运行效率"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-08-31"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
categories: ["JavaScript"]
---

# JavaScript性能优化技巧

## 引言

在上一篇文章中，我们探讨了JavaScript内存管理的基础知识。本文将深入探讨JavaScript性能优化的各种技巧，包括代码执行优化、DOM操作优化和内存优化等方面。通过掌握这些技巧，开发者可以显著提升Web应用的运行效率和用户体验。

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

## 结论

JavaScript性能优化是一个多方面的过程，涉及代码执行、DOM操作和内存管理等多个领域。通过掌握本文介绍的优化技巧，开发者可以显著提升Web应用的性能。在下一篇文章中，我们将探讨更高级的性能优化技术，包括渲染性能优化和网络性能优化等内容。`;export{n as default};
//# sourceMappingURL=08-2-BJVllsEG.js.map
