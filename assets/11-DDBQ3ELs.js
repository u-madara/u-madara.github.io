const n=`---
title: "JavaScript Web Workers与多线程编程"
excerpt: "深入探讨JavaScript Web Workers与多线程编程技术，从基础概念到高级应用，全面解析Web Workers的工作原理、通信机制、使用场景和最佳实践，帮助开发者掌握JavaScript并发编程的核心技能"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-11-21"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

# JavaScript Web Workers与多线程编程

## 引言

JavaScript是单线程语言，但现代Web应用需要处理大量计算密集型任务和并发操作。Web Workers为JavaScript提供了多线程能力，允许在后台线程中执行脚本，避免阻塞主线程。本文将深入探讨Web Workers的工作原理、使用方法、通信机制以及最佳实践，帮助开发者掌握JavaScript多线程编程技术。

## 1. Web Workers基础

### 1.1 理解JavaScript单线程模型

JavaScript最初被设计为单线程语言，这意味着一次只能执行一个任务。这种设计简化了编程模型，但也带来了性能限制。

\`\`\`javascript
// 单线程模型的局限性
function singleThreadLimitation() {
  // 模拟计算密集型任务
  function heavyComputation() {
    const start = performance.now();
    let result = 0;
    
    for (let i = 0; i < 1000000000; i++) {
      result += Math.random();
    }
    
    const end = performance.now();
    console.log(\`Computation completed in \${end - start} milliseconds\`);
    return result;
  }
  
  // UI交互
  document.getElementById('computeButton').addEventListener('click', () => {
    // 在主线程执行计算密集型任务
    const result = heavyComputation();
    document.getElementById('result').textContent = \`Result: \${result}\`;
    
    // 在计算期间，UI会完全无响应
    console.log('UI would be frozen during computation');
  });
  
  // 事件循环
  function eventLoopDemo() {
    console.log('Start');
    
    setTimeout(() => {
      console.log('Timeout callback');
    }, 0);
    
    Promise.resolve().then(() => {
      console.log('Promise callback');
    });
    
    console.log('End');
    
    // 输出顺序：
    // Start
    // End
    // Promise callback
    // Timeout callback
  }
  
  eventLoopDemo();
}

// 阻塞主线程的后果
function blockingMainThread() {
  // 模拟长时间运行的任务
  function longRunningTask() {
    const start = Date.now();
    
    // 阻塞主线程3秒
    while (Date.now() - start < 3000) {
      // 空循环
    }
    
    console.log('Long running task completed');
  }
  
  // 启动长时间运行的任务
  longRunningTask();
  
  // 在任务完成前，以下代码不会执行
  console.log('This will not appear until the task is done');
  
  // UI更新也会被阻塞
  document.body.style.backgroundColor = 'red';
  // 背景色不会立即改变，而是在任务完成后才更新
}
\`\`\`

### 1.2 Web Workers简介

Web Workers是HTML5规范的一部分，它允许JavaScript在后台线程中运行，不阻塞主线程。

\`\`\`html
<!-- Web Workers基本示例 -->
<!DOCTYPE html>
<html>
<head>
  <title>Web Workers Demo</title>
</head>
<body>
  <h1>Web Workers Demo</h1>
  <button id="startButton">Start Worker</button>
  <button id="stopButton">Stop Worker</button>
  <div id="output"></div>

  <script>
    // 主线程代码
    let worker;

    document.getElementById('startButton').addEventListener('click', () => {
      // 创建Worker
      worker = new Worker('worker.js');
      
      // 接收来自Worker的消息
      worker.onmessage = (event) => {
        document.getElementById('output').textContent = 
          \`Result from worker: \${event.data}\`;
      };
      
      // 处理Worker错误
      worker.onerror = (error) => {
        console.error('Worker error:', error);
      };
      
      // 向Worker发送消息
      worker.postMessage('Start computation');
    });

    document.getElementById('stopButton').addEventListener('click', () => {
      // 终止Worker
      if (worker) {
        worker.terminate();
        worker = null;
      }
    });
  <\/script>
</body>
</html>
\`\`\`

\`\`\`javascript
// worker.js - Worker线程代码
// 监听来自主线程的消息
self.onmessage = (event) => {
  console.log('Message received from main thread:', event.data);
  
  // 执行计算密集型任务
  const result = heavyComputation();
  
  // 向主线程发送结果
  self.postMessage(result);
};

// 计算密集型任务
function heavyComputation() {
  let result = 0;
  
  for (let i = 0; i < 1000000000; i++) {
    result += Math.random();
  }
  
  return result;
}

// 处理错误
self.onerror = (error) => {
  console.error('Error in worker:', error);
};
\`\`\`

### 1.3 Web Workers的类型

Web Workers有几种不同的类型，适用于不同的使用场景。

\`\`\`javascript
// 1. 专用Worker (Dedicated Worker)
// 只能被创建它的脚本使用

// 创建专用Worker
const dedicatedWorker = new Worker('dedicated-worker.js');

// 发送消息
dedicatedWorker.postMessage('Hello from main thread');

// 接收消息
dedicatedWorker.onmessage = (event) => {
  console.log('Message from dedicated worker:', event.data);
};

// 终止Worker
dedicatedWorker.terminate();

// 2. 共享Worker (Shared Worker)
// 可以被多个脚本/窗口共享

// 创建共享Worker
const sharedWorker = new SharedWorker('shared-worker.js');

// 连接到共享Worker
sharedWorker.port.onmessage = (event) => {
  console.log('Message from shared worker:', event.data);
};

// 启动连接
sharedWorker.port.start();

// 发送消息
sharedWorker.port.postMessage('Hello from main thread');

// 3. 服务Worker (Service Worker)
// 主要用于处理网络请求和离线缓存

// 注册服务Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      console.log('Service Worker registered:', registration);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}

// 4. 内联Worker (Inline Worker)
// 使用Blob URL创建Worker，无需单独文件

const workerCode = \`
  self.onmessage = (event) => {
    console.log('Inline worker received:', event.data);
    self.postMessage('Response from inline worker');
  };
\`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);
const inlineWorker = new Worker(workerUrl);

inlineWorker.onmessage = (event) => {
  console.log('Message from inline worker:', event.data);
};

inlineWorker.postMessage('Hello to inline worker');

// 使用完成后释放Blob URL
inlineWorker.terminate();
URL.revokeObjectURL(workerUrl);
\`\`\`

## 2. Web Workers通信机制

### 2.1 消息传递

Web Workers与主线程之间的通信是通过消息传递实现的，这种通信是异步的，基于事件监听。

\`\`\`javascript
// 主线程代码
function mainThreadCommunication() {
  // 创建Worker
  const worker = new Worker('communication-worker.js');
  
  // 发送不同类型的数据
  worker.postMessage({
    type: 'start',
    payload: {
      data: [1, 2, 3, 4, 5],
      options: { algorithm: 'quickSort' }
    }
  });
  
  // 接收消息
  worker.onmessage = (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'progress':
        console.log(\`Progress: \${payload.percentage}%\`);
        updateProgressBar(payload.percentage);
        break;
        
      case 'result':
        console.log('Result:', payload.result);
        displayResult(payload.result);
        break;
        
      case 'error':
        console.error('Worker error:', payload.message);
        showError(payload.message);
        break;
    }
  };
  
  // 处理错误
  worker.onerror = (error) => {
    console.error('Worker error:', error);
  };
  
  // 终止Worker
  function terminateWorker() {
    worker.terminate();
  }
}

// Worker线程代码
// communication-worker.js
self.onmessage = (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'start':
      processData(payload.data, payload.options);
      break;
  }
};

function processData(data, options) {
  // 发送进度更新
  self.postMessage({
    type: 'progress',
    payload: { percentage: 0 }
  });
  
  // 模拟处理过程
  for (let i = 0; i <= 100; i += 10) {
    // 模拟处理延迟
    const start = Date.now();
    while (Date.now() - start < 100) {}
    
    // 发送进度更新
    self.postMessage({
      type: 'progress',
      payload: { percentage: i }
    });
  }
  
  // 处理数据
  let result;
  try {
    switch (options.algorithm) {
      case 'quickSort':
        result = quickSort(data);
        break;
      default:
        result = data.sort();
    }
    
    // 发送结果
    self.postMessage({
      type: 'result',
      payload: { result }
    });
  } catch (error) {
    // 发送错误
    self.postMessage({
      type: 'error',
      payload: { message: error.message }
    });
  }
}

function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}
\`\`\`

### 2.2 数据传递方式

Web Workers与主线程之间的数据传递有两种方式：复制消息和转移消息。

\`\`\`javascript
// 1. 复制消息 (Structured Clone)
// 数据被复制，发送方和接收方拥有独立副本

function structuredCloning() {
  const worker = new Worker('cloning-worker.js');
  
  // 发送复杂对象
  const complexObject = {
    number: 42,
    string: 'Hello',
    array: [1, 2, 3],
    object: { nested: true },
    date: new Date(),
    regex: /pattern/g,
    map: new Map([['key', 'value']]),
    set: new Set([1, 2, 3])
  };
  
  console.log('Before sending:', complexObject);
  
  worker.postMessage(complexObject);
  
  // 修改原始对象
  complexObject.number = 100;
  
  worker.onmessage = (event) => {
    console.log('Received in worker:', event.data);
    // 接收到的对象是原始对象的副本，不受修改影响
  };
}

// Worker代码
// cloning-worker.js
self.onmessage = (event) => {
  const data = event.data;
  
  // 修改接收到的数据
  data.number = 200;
  
  console.log('Modified in worker:', data);
  
  // 发送回主线程
  self.postMessage(data);
};

// 2. 转移消息 (Transferable Objects)
// 数据的所有权被转移，发送方失去访问权，更高效

function transferableObjects() {
  const worker = new Worker('transfer-worker.js');
  
  // 创建大型数据
  const largeArray = new Uint8Array(1024 * 1024 * 10); // 10MB
  
  // 填充数据
  for (let i = 0; i < largeArray.length; i++) {
    largeArray[i] = i % 256;
  }
  
  console.log('Before transfer - length:', largeArray.length);
  
  // 使用转移消息
  worker.postMessage(
    { buffer: largeArray },
    [largeArray.buffer] // 转移所有权
  );
  
  // 转移后，largeArray被清空
  console.log('After transfer - length:', largeArray.length); // 0
  
  worker.onmessage = (event) => {
    const { processedLength } = event.data;
    console.log('Processed length:', processedLength);
  };
}

// Worker代码
// transfer-worker.js
self.onmessage = (event) => {
  const { buffer } = event.data;
  
  // 处理数据
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i];
  }
  
  // 发送处理结果
  self.postMessage({ processedLength: buffer.length });
  
  // 处理完成后，buffer会被自动释放
};

// 3. 共享内存 (SharedArrayBuffer)
// 多个线程可以同时访问同一内存区域

function sharedMemory() {
  // 检查浏览器支持
  if (typeof SharedArrayBuffer === 'undefined') {
    console.error('SharedArrayBuffer is not supported');
    return;
  }
  
  // 创建共享内存
  const sharedBuffer = new SharedArrayBuffer(1024);
  const sharedArray = new Int32Array(sharedBuffer);
  
  // 创建多个Worker
  const workers = [];
  const workerCount = 4;
  
  for (let i = 0; i < workerCount; i++) {
    const worker = new Worker('shared-memory-worker.js');
    
    // 发送共享内存
    worker.postMessage({
      sharedBuffer,
      workerId: i
    });
    
    workers.push(worker);
  }
  
  // 主线程也可以访问共享内存
  sharedArray[0] = 42;
  
  // 等待所有Worker完成
  let completedCount = 0;
  workers.forEach(worker => {
    worker.onmessage = (event) => {
      console.log(\`Worker \${event.data.workerId} completed\`);
      completedCount++;
      
      if (completedCount === workerCount) {
        console.log('All workers completed');
        console.log('Final shared array:', sharedArray);
        
        // 终止所有Worker
        workers.forEach(w => w.terminate());
      }
    };
  });
}

// Worker代码
// shared-memory-worker.js
self.onmessage = (event) => {
  const { sharedBuffer, workerId } = event.data;
  const sharedArray = new Int32Array(sharedBuffer);
  
  // 使用原子操作确保线程安全
  const oldValue = Atomics.add(sharedArray, 1, 1);
  
  // 模拟工作
  const start = Date.now();
  while (Date.now() - start < 1000) {}
  
  // 完成工作
  self.postMessage({ workerId });
};
\`\`\`

## 3. Web Workers的实际应用

### 3.1 计算密集型任务

Web Workers非常适合处理计算密集型任务，如数据分析、图像处理等。

\`\`\`javascript
// 图像处理Worker
// image-processing-worker.js
self.onmessage = (event) => {
  const { imageData, operation, params } = event.data;
  
  let result;
  
  switch (operation) {
    case 'grayscale':
      result = convertToGrayscale(imageData);
      break;
    case 'blur':
      result = applyBlur(imageData, params.radius);
      break;
    case 'sharpen':
      result = applySharpen(imageData, params.amount);
      break;
    default:
      throw new Error(\`Unknown operation: \${operation}\`);
  }
  
  // 发送处理后的图像数据
  self.postMessage({
    type: 'result',
    imageData: result
  });
};

function convertToGrayscale(imageData) {
  const data = imageData.data;
  const result = new ImageData(
    new Uint8ClampedArray(data),
    imageData.width,
    imageData.height
  );
  
  for (let i = 0; i < result.data.length; i += 4) {
    const r = result.data[i];
    const g = result.data[i + 1];
    const b = result.data[i + 2];
    
    // 计算灰度值
    const gray = r * 0.299 + g * 0.587 + b * 0.114;
    
    result.data[i] = gray;     // R
    result.data[i + 1] = gray; // G
    result.data[i + 2] = gray; // B
    // Alpha通道保持不变
  }
  
  return result;
}

function applyBlur(imageData, radius) {
  // 简化的模糊算法
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const result = new ImageData(
    new Uint8ClampedArray(data),
    width,
    height
  );
  
  // 应用模糊效果
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let count = 0;
      
      // 采样周围像素
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const idx = (ny * width + nx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }
      }
      
      // 计算平均值
      const idx = (y * width + x) * 4;
      result.data[idx] = r / count;
      result.data[idx + 1] = g / count;
      result.data[idx + 2] = b / count;
      result.data[idx + 3] = a / count;
    }
  }
  
  return result;
}

// 主线程使用示例
function imageProcessingExample() {
  const canvas = document.getElementById('imageCanvas');
  const ctx = canvas.getContext('2d');
  
  // 加载图像
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 创建Worker
    const worker = new Worker('image-processing-worker.js');
    
    // 显示进度
    const progressElement = document.getElementById('progress');
    
    worker.onmessage = (event) => {
      if (event.data.type === 'result') {
        // 显示处理后的图像
        ctx.putImageData(event.data.imageData, 0, 0);
        progressElement.textContent = 'Processing complete!';
      }
    };
    
    worker.onerror = (error) => {
      progressElement.textContent = \`Error: \${error.message}\`;
    };
    
    // 开始处理
    progressElement.textContent = 'Processing...';
    worker.postMessage({
      imageData,
      operation: 'grayscale'
    });
  };
  
  img.src = 'example.jpg';
}

// 数据分析Worker
// data-analysis-worker.js
self.onmessage = (event) => {
  const { data, analysisType } = event.data;
  
  let result;
  
  switch (analysisType) {
    case 'statistics':
      result = calculateStatistics(data);
      break;
    case 'correlation':
      result = calculateCorrelation(data);
      break;
    case 'regression':
      result = performRegression(data);
      break;
    default:
      throw new Error(\`Unknown analysis type: \${analysisType}\`);
  }
  
  // 发送分析结果
  self.postMessage({
    type: 'result',
    analysisType,
    result
  });
};

function calculateStatistics(data) {
  const n = data.length;
  let sum = 0;
  let sumSquares = 0;
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < n; i++) {
    const value = data[i];
    sum += value;
    sumSquares += value * value;
    
    if (value < min) min = value;
    if (value > max) max = value;
  }
  
  const mean = sum / n;
  const variance = (sumSquares / n) - (mean * mean);
  const stdDev = Math.sqrt(variance);
  
  return {
    count: n,
    mean,
    variance,
    stdDev,
    min,
    max
  };
}

function calculateCorrelation(data) {
  // 假设data是二维数组 [[x1, y1], [x2, y2], ...]
  const n = data.length;
  
  let sumX = 0, sumY = 0;
  let sumXY = 0;
  let sumX2 = 0, sumY2 = 0;
  
  for (let i = 0; i < n; i++) {
    const x = data[i][0];
    const y = data[i][1];
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function performRegression(data) {
  // 简单线性回归
  const n = data.length;
  let sumX = 0, sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    const x = data[i][0];
    const y = data[i][1];
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // 计算R²
  let sumSquaredErrors = 0;
  let sumSquaredTotal = 0;
  const meanY = sumY / n;
  
  for (let i = 0; i < n; i++) {
    const x = data[i][0];
    const y = data[i][1];
    const predictedY = slope * x + intercept;
    
    sumSquaredErrors += Math.pow(y - predictedY, 2);
    sumSquaredTotal += Math.pow(y - meanY, 2);
  }
  
  const rSquared = 1 - (sumSquaredErrors / sumSquaredTotal);
  
  return {
    slope,
    intercept,
    rSquared
  };
}
\`\`\`

### 3.2 网络请求与数据处理

Web Workers可以用于处理网络请求和大量数据，避免阻塞主线程。

\`\`\`javascript
// 网络请求Worker
// network-worker.js
self.onmessage = (event) => {
  const { urls, options } = event.data;
  
  // 并发请求多个URL
  Promise.all(urls.map(url => fetch(url, options)))
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(data => {
      // 处理数据
      const processedData = processData(data);
      
      // 发送结果
      self.postMessage({
        type: 'success',
        data: processedData
      });
    })
    .catch(error => {
      // 发送错误
      self.postMessage({
        type: 'error',
        error: error.message
      });
    });
};

function processData(data) {
  // 合并和处理数据
  const merged = data.reduce((acc, item) => {
    return { ...acc, ...item };
  }, {});
  
  // 转换为所需格式
  return Object.entries(merged).map(([key, value]) => ({
    id: key,
    value,
    timestamp: Date.now()
  }));
}

// 主线程使用示例
function networkRequestExample() {
  const urls = [
    'https://api.example.com/data1',
    'https://api.example.com/data2',
    'https://api.example.com/data3'
  ];
  
  const worker = new Worker('network-worker.js');
  
  // 显示加载状态
  const statusElement = document.getElementById('status');
  statusElement.textContent = 'Loading data...';
  
  worker.onmessage = (event) => {
    if (event.data.type === 'success') {
      // 处理成功响应
      const data = event.data.data;
      displayData(data);
      statusElement.textContent = \`Loaded \${data.length} items\`;
    } else if (event.data.type === 'error') {
      // 处理错误
      statusElement.textContent = \`Error: \${event.data.error}\`;
    }
  };
  
  worker.onerror = (error) => {
    statusElement.textContent = \`Worker error: \${error.message}\`;
  };
  
  // 开始请求
  worker.postMessage({ urls });
}

// 大数据处理Worker
// big-data-worker.js
self.onmessage = (event) => {
  const { data, operation } = event.data;
  
  // 分块处理大数据
  const chunkSize = 10000;
  const chunks = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  // 处理每个块
  const results = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let chunkResult;
    
    switch (operation) {
      case 'filter':
        chunkResult = filterData(chunk);
        break;
      case 'transform':
        chunkResult = transformData(chunk);
        break;
      case 'aggregate':
        chunkResult = aggregateData(chunk);
        break;
      default:
        throw new Error(\`Unknown operation: \${operation}\`);
    }
    
    results.push(chunkResult);
    
    // 发送进度更新
    self.postMessage({
      type: 'progress',
      percentage: Math.round((i + 1) / chunks.length * 100)
    });
  }
  
  // 合并结果
  let finalResult;
  
  switch (operation) {
    case 'filter':
    case 'transform':
      finalResult = results.flat();
      break;
    case 'aggregate':
      finalResult = mergeAggregates(results);
      break;
  }
  
  // 发送最终结果
  self.postMessage({
    type: 'result',
    data: finalResult
  });
};

function filterData(data) {
  // 示例：过滤出大于某个值的数据
  return data.filter(item => item.value > 100);
}

function transformData(data) {
  // 示例：转换数据格式
  return data.map(item => ({
    id: item.id,
    value: item.value * 2,
    category: item.value > 200 ? 'high' : 'low'
  }));
}

function aggregateData(data) {
  // 示例：聚合数据
  const sum = data.reduce((acc, item) => acc + item.value, 0);
  const count = data.length;
  const average = sum / count;
  
  return {
    sum,
    count,
    average,
    min: Math.min(...data.map(item => item.value)),
    max: Math.max(...data.map(item => item.value))
  };
}

function mergeAggregates(aggregates) {
  const totalSum = aggregates.reduce((acc, agg) => acc + agg.sum, 0);
  const totalCount = aggregates.reduce((acc, agg) => acc + agg.count, 0);
  const overallAverage = totalSum / totalCount;
  const globalMin = Math.min(...aggregates.map(agg => agg.min));
  const globalMax = Math.max(...aggregates.map(agg => agg.max));
  
  return {
    sum: totalSum,
    count: totalCount,
    average: overallAverage,
    min: globalMin,
    max: globalMax
  };
}

// 主线程使用示例
function bigDataProcessingExample() {
  // 生成大量测试数据
  const largeData = Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    value: Math.random() * 300
  }));
  
  const worker = new Worker('big-data-worker.js');
  
  // 显示进度
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  worker.onmessage = (event) => {
    if (event.data.type === 'progress') {
      // 更新进度条
      const percentage = event.data.percentage;
      progressBar.style.width = \`\${percentage}%\`;
      progressText.textContent = \`\${percentage}%\`;
    } else if (event.data.type === 'result') {
      // 显示结果
      const result = event.data.data;
      console.log('Processing result:', result);
      displayResult(result);
    }
  };
  
  // 开始处理
  worker.postMessage({
    data: largeData,
    operation: 'aggregate'
  });
}
\`\`\`

## 4. Web Workers高级特性

### 4.1 共享Worker

共享Worker可以被多个脚本或窗口共享，适用于需要跨页面通信的场景。

\`\`\`javascript
// 共享Worker代码
// shared-worker.js
const connections = [];

// 监听连接事件
self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);
  
  // 监听来自该连接的消息
  port.onmessage = (event) => {
    const { type, data, senderId } = event.data;
    
    switch (type) {
      case 'broadcast':
        // 广播消息给所有连接（除了发送者）
        connections.forEach(p => {
          if (p !== port) {
            p.postMessage({
              type: 'broadcast',
              data,
              senderId
            });
          }
        });
        break;
        
      case 'private':
        // 私人消息给特定连接
        const targetPort = connections.find(p => p.id === data.targetId);
        if (targetPort) {
          targetPort.postMessage({
            type: 'private',
            data: data.message,
            senderId
          });
        }
        break;
        
      case 'status':
        // 发送连接状态
        port.postMessage({
          type: 'status',
          data: {
            connectionCount: connections.length,
            connectionIds: connections.map(p => p.id)
          }
        });
        break;
    }
  };
  
  // 监听连接关闭事件
  port.onclose = () => {
    const index = connections.indexOf(port);
    if (index !== -1) {
      connections.splice(index, 1);
    }
    
    // 通知其他连接
    connections.forEach(p => {
      p.postMessage({
        type: 'disconnected',
        data: { connectionId: port.id }
      });
    });
  };
  
  // 为连接分配唯一ID
  port.id = Date.now() + Math.random();
  
  // 通知新连接
  port.postMessage({
    type: 'connected',
    data: { connectionId: port.id }
  });
  
  // 通知其他连接有新连接加入
  connections.forEach(p => {
    if (p !== port) {
      p.postMessage({
        type: 'newConnection',
        data: { connectionId: port.id }
      });
    }
  });
};

// 主页面代码
// main-page.js
// 创建共享Worker
const sharedWorker = new SharedWorker('shared-worker.js');

// 连接到共享Worker
sharedWorker.port.start();

// 接收消息
sharedWorker.port.onmessage = (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'connected':
      console.log('Connected to shared worker with ID:', data.connectionId);
      myConnectionId = data.connectionId;
      updateConnectionStatus();
      break;
      
    case 'broadcast':
      displayMessage(data, \`Broadcast from \${event.data.senderId}\`);
      break;
      
    case 'private':
      displayMessage(data, \`Private message from \${event.data.senderId}\`);
      break;
      
    case 'status':
      updateConnectionList(data);
      break;
      
    case 'newConnection':
      addConnectionToList(data.connectionId);
      break;
      
    case 'disconnected':
      removeConnectionFromList(data.connectionId);
      break;
  }
};

// 发送广播消息
function sendBroadcast(message) {
  sharedWorker.port.postMessage({
    type: 'broadcast',
    data: message,
    senderId: myConnectionId
  });
}

// 发送私人消息
function sendPrivateMessage(targetId, message) {
  sharedWorker.port.postMessage({
    type: 'private',
    data: {
      targetId,
      message
    },
    senderId: myConnectionId
  });
}

// 请求连接状态
function requestStatus() {
  sharedWorker.port.postMessage({
    type: 'status'
  });
}

// 页面卸载时断开连接
window.addEventListener('beforeunload', () => {
  sharedWorker.port.close();
});
\`\`\`

### 4.2 动态创建Worker

有时我们需要动态创建和管理多个Worker，以实现并行处理。

\`\`\`javascript
// 动态Worker池
class WorkerPool {
  constructor(workerScript, poolSize = 4) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    this.busyWorkers = new Set();
    
    // 初始化Worker池
    this.initWorkers();
  }
  
  initWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScript);
      worker.id = i;
      
      // 监听Worker消息
      worker.onmessage = (event) => {
        this.handleWorkerMessage(worker, event);
      };
      
      worker.onerror = (error) => {
        console.error(\`Worker \${worker.id} error:\`, error);
        this.releaseWorker(worker);
      };
      
      this.workers.push(worker);
    }
  }
  
  // 提交任务
  postTask(data, transferables) {
    return new Promise((resolve, reject) => {
      const task = {
        data,
        transferables,
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      // 尝试立即执行任务
      if (!this.executeTask(task)) {
        // 如果没有可用Worker，加入队列
        this.taskQueue.push(task);
      }
    });
  }
  
  // 执行任务
  executeTask(task) {
    const availableWorker = this.getAvailableWorker();
    
    if (!availableWorker) {
      return false;
    }
    
    // 标记Worker为忙碌
    this.busyWorkers.add(availableWorker);
    
    // 存储任务回调
    availableWorker.currentTask = task;
    
    // 发送任务到Worker
    if (task.transferables) {
      availableWorker.postMessage(task.data, task.transferables);
    } else {
      availableWorker.postMessage(task.data);
    }
    
    return true;
  }
  
  // 获取可用Worker
  getAvailableWorker() {
    return this.workers.find(worker => !this.busyWorkers.has(worker));
  }
  
  // 处理Worker消息
  handleWorkerMessage(worker, event) {
    const task = worker.currentTask;
    
    if (!task) {
      console.warn(\`Received message from idle worker \${worker.id}\`);
      return;
    }
    
    // 解决任务Promise
    task.resolve(event.data);
    
    // 释放Worker
    this.releaseWorker(worker);
    
    // 处理队列中的下一个任务
    this.processQueue();
  }
  
  // 释放Worker
  releaseWorker(worker) {
    this.busyWorkers.delete(worker);
    worker.currentTask = null;
  }
  
  // 处理任务队列
  processQueue() {
    if (this.taskQueue.length === 0) {
      return;
    }
    
    const task = this.taskQueue.shift();
    if (!this.executeTask(task)) {
      // 如果仍然没有可用Worker，将任务放回队列前端
      this.taskQueue.unshift(task);
    }
  }
  
  // 获取池状态
  getStatus() {
    return {
      totalWorkers: this.poolSize,
      busyWorkers: this.busyWorkers.size,
      availableWorkers: this.poolSize - this.busyWorkers.size,
      queuedTasks: this.taskQueue.length
    };
  }
  
  // 终止所有Worker
  terminate() {
    this.workers.forEach(worker => {
      worker.terminate();
    });
    
    this.workers = [];
    this.busyWorkers.clear();
    this.taskQueue = [];
  }
}

// 使用Worker池
function useWorkerPool() {
  // 创建Worker池
  const workerPool = new WorkerPool('task-worker.js', 4);
  
  // 生成多个任务
  const tasks = [];
  for (let i = 0; i < 20; i++) {
    tasks.push({
      id: i,
      data: generateTaskData(i)
    });
  }
  
  // 提交所有任务
  const promises = tasks.map(task => 
    workerPool.postTask(task)
  );
  
  // 等待所有任务完成
  Promise.all(promises)
    .then(results => {
      console.log('All tasks completed:', results);
    })
    .catch(error => {
      console.error('Task execution failed:', error);
    })
    .finally(() => {
      // 终止Worker池
      workerPool.terminate();
    });
  
  // 定期显示状态
  const statusInterval = setInterval(() => {
    const status = workerPool.getStatus();
    console.log('Worker pool status:', status);
    
    if (status.queuedTasks === 0 && status.busyWorkers === 0) {
      clearInterval(statusInterval);
    }
  }, 1000);
}

// 生成任务数据
function generateTaskData(id) {
  return {
    taskId: id,
    operation: 'compute',
    parameters: {
      iterations: 1000000 + id * 100000,
      algorithm: id % 2 === 0 ? 'quick' : 'standard'
    }
  };
}

// Worker代码
// task-worker.js
self.onmessage = (event) => {
  const { taskId, operation, parameters } = event.data;
  
  let result;
  
  switch (operation) {
    case 'compute':
      result = performComputation(parameters);
      break;
    default:
      throw new Error(\`Unknown operation: \${operation}\`);
  }
  
  // 发送结果
  self.postMessage({
    taskId,
    result,
    workerId: self.id || 'unknown'
  });
};

function performComputation(parameters) {
  const { iterations, algorithm } = parameters;
  let result = 0;
  
  const start = performance.now();
  
  if (algorithm === 'quick') {
    // 快速算法
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i);
    }
  } else {
    // 标准算法
    for (let i = 0; i < iterations; i++) {
      result += Math.pow(i, 0.5);
    }
  }
  
  const end = performance.now();
  
  return {
    value: result,
    computationTime: end - start,
    iterations
  };
}
\`\`\`

## 5. Web Workers的限制与注意事项

### 5.1 Web Workers的限制

Web Workers有一些重要的限制，了解这些限制有助于正确使用Workers。

\`\`\`javascript
// Web Workers的限制演示
function workerLimitations() {
  // 1. 无法直接访问DOM
  // Worker代码中不能直接操作DOM元素
  
  // 主线程代码
  const worker = new Worker('limitations-worker.js');
  
  worker.onmessage = (event) => {
    // Worker不能直接修改DOM，必须通过消息传递
    if (event.data.type === 'updateUI') {
      document.getElementById('result').textContent = event.data.content;
    }
  };
  
  // 2. 有限的JavaScript API访问
  // Worker中不能访问以下API：
  // - window对象
  // - document对象
  // - parent对象
  // - localStorage, sessionStorage
  // - alert(), confirm()
  
  // 3. 同源策略限制
  // Worker脚本必须与主页面同源，或者使用CORS
  
  // 4. 无法直接访问主线程变量
  // 必须通过消息传递共享数据
  
  // 5. 消息传递是异步的
  // 没有同步通信机制
  
  // 6. 不能直接创建Worker
  // Worker中不能再创建新的Worker（某些浏览器支持）
}

// Worker代码
// limitations-worker.js
// 以下代码在Worker中运行

// 可以使用的API
console.log('Worker console');
console.log('Current time:', new Date());

// 可以使用定时器
setTimeout(() => {
  console.log('Timeout in worker');
}, 1000);

// 可以使用网络请求
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => {
    console.log('Data fetched in worker:', data);
    
    // 通过消息传递数据到主线程
    self.postMessage({
      type: 'updateUI',
      content: \`Fetched \${data.length} items\`
    });
  });

// 可以使用WebSockets
const socket = new WebSocket('wss://echo.websocket.org');

socket.onopen = () => {
  console.log('WebSocket connected in worker');
  socket.send('Hello from worker');
};

socket.onmessage = (event) => {
  console.log('WebSocket message in worker:', event.data);
};

// 可以使用IndexedDB
const request = indexedDB.open('workerDB', 1);

request.onsuccess = (event) => {
  const db = event.target.result;
  console.log('IndexedDB opened in worker');
};

// 不能使用的API
try {
  // 以下代码会抛出错误
  // console.log(window); // window未定义
  // console.log(document); // document未定义
  // localStorage.setItem('key', 'value'); // localStorage未定义
  // alert('Hello'); // alert未定义
} catch (error) {
  console.error('API not available in worker:', error.message);
}
\`\`\`

### 5.2 安全考虑

使用Web Workers时需要注意一些安全相关问题。

\`\`\`javascript
// Web Workers安全考虑
function workerSecurity() {
  // 1. 验证Worker来源
  function createSecureWorker(url) {
    // 验证URL是否可信
    if (!isTrustedWorkerUrl(url)) {
      throw new Error('Untrusted worker URL');
    }
    
    return new Worker(url);
  }
  
  function isTrustedWorkerUrl(url) {
    // 实现URL验证逻辑
    const trustedOrigins = [
      'https://yourdomain.com',
      'https://cdn.yourdomain.com'
    ];
    
    try {
      const urlObj = new URL(url, window.location.href);
      return trustedOrigins.includes(urlObj.origin);
    } catch (e) {
      return false;
    }
  }
  
  // 2. 验证消息内容
  const worker = new Worker('secure-worker.js');
  
  worker.onmessage = (event) => {
    // 验证消息结构
    if (!isValidMessage(event.data)) {
      console.error('Invalid message from worker');
      return;
    }
    
    // 安全处理消息
    handleSecureMessage(event.data);
  };
  
  function isValidMessage(data) {
    // 实现消息验证逻辑
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      (data.type === 'result' || data.type === 'error')
    );
  }
  
  function handleSecureMessage(data) {
    switch (data.type) {
      case 'result':
        // 安全处理结果
        if (typeof data.result === 'string' && data.result.length < 1000) {
          console.log('Worker result:', data.result);
        }
        break;
        
      case 'error':
        // 安全处理错误
        console.error('Worker error:', data.message);
        break;
    }
  }
  
  // 3. 避免XSS攻击
  function sanitizeWorkerOutput(output) {
    // 实现输出清理逻辑
    const div = document.createElement('div');
    div.textContent = output; // 自动转义HTML
    return div.innerHTML;
  }
  
  // 4. 使用Content Security Policy (CSP)
  // 在HTTP头部设置适当的CSP规则
  // Content-Security-Policy: script-src 'self' 'unsafe-eval' blob:;
  
  // 5. 限制Worker权限
  function createRestrictedWorker(url) {
    const worker = new Worker(url);
    
    // 设置超时
    const timeout = setTimeout(() => {
      worker.terminate();
      console.error('Worker terminated due to timeout');
    }, 30000); // 30秒超时
    
    worker.onmessage = (event) => {
      clearTimeout(timeout);
      // 处理消息
    };
    
    worker.onerror = (error) => {
      clearTimeout(timeout);
      console.error('Worker error:', error);
    };
    
    return worker;
  }
}

// 安全的Worker代码
// secure-worker.js
// Worker内部也应该实现安全措施

// 1. 验证输入
self.onmessage = (event) => {
  if (!isValidInput(event.data)) {
    self.postMessage({
      type: 'error',
      message: 'Invalid input'
    });
    return;
  }
  
  // 处理输入
  try {
    const result = processInput(event.data);
    
    // 验证输出
    if (isValidOutput(result)) {
      self.postMessage({
        type: 'result',
        result
      });
    } else {
      self.postMessage({
        type: 'error',
        message: 'Invalid output generated'
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error.message
    });
  }
};

function isValidInput(data) {
  // 实现输入验证逻辑
  return (
    data &&
    typeof data === 'object' &&
    typeof data.operation === 'string' &&
    ['compute', 'transform', 'filter'].includes(data.operation)
  );
}

function isValidOutput(result) {
  // 实现输出验证逻辑
  return (
    result !== null &&
    typeof result !== 'undefined' &&
    !(result instanceof Error)
  );
}

function processInput(data) {
  switch (data.operation) {
    case 'compute':
      return performComputation(data.parameters);
    case 'transform':
      return transformData(data.input);
    case 'filter':
      return filterData(data.input, data.criteria);
    default:
      throw new Error(\`Unknown operation: \${data.operation}\`);
  }
}

// 2. 避免使用eval和Function构造函数
function safeComputation(code) {
  // 不使用eval，而是使用安全的替代方案
  // return eval(code); // 不安全
  
  // 使用白名单方法
  const allowedOperations = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => a / b
  };
  
  const { operation, a, b } = code;
  
  if (allowedOperations[operation]) {
    return allowedOperations[operation](a, b);
  } else {
    throw new Error(\`Operation not allowed: \${operation}\`);
  }
}
\`\`\`

## 6. Web Workers最佳实践

### 6.1 性能优化

优化Web Workers的使用可以提高应用性能和响应速度。

\`\`\`javascript
// Web Workers性能优化
function workerPerformanceOptimization() {
  // 1. 合理分配任务
  function optimizeTaskDistribution() {
    // 根据任务复杂度和数量动态调整Worker数量
    const cpuCores = navigator.hardwareConcurrency || 4;
    const workerCount = Math.min(cpuCores, 8); // 限制最大Worker数
    
    console.log(\`Using \${workerCount} workers for optimal performance\`);
    
    // 创建Worker池
    const workerPool = new WorkerPool('optimized-worker.js', workerCount);
    
    return workerPool;
  }
  
  // 2. 使用Transferable Objects减少复制开销
  function useTransferableObjects() {
    const worker = new Worker('transfer-worker.js');
    
    // 创建大型数据
    const largeArray = new Uint8Array(1024 * 1024 * 10); // 10MB
    
    // 填充数据
    for (let i = 0; i < largeArray.length; i++) {
      largeArray[i] = i % 256;
    }
    
    // 使用转移消息
    worker.postMessage(
      { buffer: largeArray },
      [largeArray.buffer] // 转移所有权
    );
    
    // 转移后，largeArray被清空
    console.log('After transfer - length:', largeArray.length); // 0
  }
  
  // 3. 批量处理消息
  function batchMessageProcessing() {
    const worker = new Worker('batch-worker.js');
    
    // 批量发送任务
    const tasks = [];
    for (let i = 0; i < 100; i++) {
      tasks.push({
        id: i,
        data: generateTaskData(i)
      });
    }
    
    // 一次性发送所有任务
    worker.postMessage({
      type: 'batch',
      tasks
    });
    
    worker.onmessage = (event) => {
      if (event.data.type === 'batchResult') {
        // 处理批量结果
        const results = event.data.results;
        console.log(\`Processed \${results.length} tasks\`);
      }
    };
  }
  
  // 4. 避免频繁创建和销毁Worker
  function reuseWorkers() {
    // 使用单例模式管理Worker
    class WorkerManager {
      constructor() {
        this.workers = new Map();
      }
      
      getWorker(scriptUrl) {
        if (!this.workers.has(scriptUrl)) {
          const worker = new Worker(scriptUrl);
          this.workers.set(scriptUrl, worker);
        }
        
        return this.workers.get(scriptUrl);
      }
      
      terminateAll() {
        this.workers.forEach(worker => {
          worker.terminate();
        });
        this.workers.clear();
      }
    }
    
    const workerManager = new WorkerManager();
    
    // 重用Worker
    const worker1 = workerManager.getWorker('task-worker.js');
    const worker2 = workerManager.getWorker('task-worker.js');
    
    console.log(worker1 === worker2); // true，重用同一个Worker
  }
  
  // 5. 使用SharedArrayBuffer进行高效数据共享
  function useSharedMemory() {
    // 检查浏览器支持
    if (typeof SharedArrayBuffer === 'undefined') {
      console.error('SharedArrayBuffer is not supported');
      return;
    }
    
    // 创建共享内存
    const sharedBuffer = new SharedArrayBuffer(1024);
    const sharedArray = new Int32Array(sharedBuffer);
    
    // 创建多个Worker
    const workers = [];
    const workerCount = 4;
    
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker('shared-memory-worker.js');
      
      // 发送共享内存
      worker.postMessage({
        sharedBuffer,
        workerId: i
      });
      
      workers.push(worker);
    }
    
    // 主线程也可以访问共享内存
    sharedArray[0] = 42;
    
    // 使用原子操作确保线程安全
    const newValue = Atomics.add(sharedArray, 1, 1);
    console.log('New value:', newValue);
  }
}

// 优化的Worker代码
// optimized-worker.js
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'single':
      // 处理单个任务
      const result = processTask(data);
      self.postMessage({
        type: 'result',
        taskId: data.id,
        result
      });
      break;
      
    case 'batch':
      // 批量处理任务
      const results = data.tasks.map(task => ({
        taskId: task.id,
        result: processTask(task.data)
      }));
      
      self.postMessage({
        type: 'batchResult',
        results
      });
      break;
  }
};

// 优化的任务处理
function processTask(taskData) {
  // 使用高效的算法
  const { operation, parameters } = taskData;
  
  switch (operation) {
    case 'compute':
      return optimizedComputation(parameters);
    case 'transform':
      return optimizedTransform(parameters);
    default:
      throw new Error(\`Unknown operation: \${operation}\`);
  }
}

function optimizedComputation(parameters) {
  // 使用WebAssembly进行高性能计算（如果可用）
  if (typeof WebAssembly !== 'undefined') {
    return wasmComputation(parameters);
  } else {
    // 降级到JavaScript实现
    return jsComputation(parameters);
  }
}

// WebAssembly计算模块
async function wasmComputation(parameters) {
  // 加载WebAssembly模块
  const wasmModule = await WebAssembly.instantiateStreaming(
    fetch('computation.wasm')
  );
  
  const { compute } = wasmModule.instance.exports;
  
  // 调用WebAssembly函数
  return compute(parameters.input, parameters.iterations);
}

// JavaScript计算实现
function jsComputation(parameters) {
  const { input, iterations } = parameters;
  let result = input;
  
  for (let i = 0; i < iterations; i++) {
    result = Math.sqrt(result) * 1.01;
  }
  
  return result;
}
\`\`\`

### 6.2 错误处理与调试

良好的错误处理和调试技巧对于开发可靠的Web Workers应用至关重要。

\`\`\`javascript
// Web Workers错误处理与调试
function workerErrorHandlingAndDebugging() {
  // 1. 全局错误处理
  const worker = new Worker('debug-worker.js');
  
  // 处理Worker错误
  worker.onerror = (error) => {
    console.error('Worker error:', {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno
    });
    
    // 尝试恢复
    handleWorkerError(worker, error);
  };
  
  // 处理Worker消息错误
  worker.onmessage = (event) => {
    try {
      if (event.data.type === 'error') {
        throw new Error(event.data.message);
      }
      
      // 处理正常消息
      processWorkerMessage(event.data);
    } catch (error) {
      console.error('Error processing worker message:', error);
      handleProcessingError(error, event.data);
    }
  };
  
  // 2. 超时处理
  function executeWithTimeout(worker, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      let completed = false;
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          reject(new Error('Worker operation timed out'));
        }
      }, timeout);
      
      // 处理响应
      const originalHandler = worker.onmessage;
      worker.onmessage = (event) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          worker.onmessage = originalHandler;
          resolve(event.data);
        }
      };
      
      // 发送数据
      worker.postMessage(data);
    });
  }
  
  // 3. 重试机制
  async function executeWithRetry(worker, data, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await executeWithTimeout(worker, data);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(\`Worker execution failed (attempt \${i + 1}/\${maxRetries}):\`, error.message);
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    throw lastError;
  }
  
  // 4. 调试日志
  function createDebugWorker(scriptUrl) {
    const worker = new Worker(scriptUrl);
    
    // 拦截所有消息进行日志
    const originalPostMessage = worker.postMessage.bind(worker);
    worker.postMessage = (data, transferables) => {
      console.log('Sending to worker:', data);
      return originalPostMessage(data, transferables);
    };
    
    // 拦截所有消息进行日志
    worker.addEventListener('message', (event) => {
      console.log('Received from worker:', event.data);
    });
    
    return worker;
  }
  
  // 5. 状态监控
  class WorkerMonitor {
    constructor(worker) {
      this.worker = worker;
      this.startTime = Date.now();
      this.messageCount = 0;
      this.errorCount = 0;
      
      // 监控消息
      this.worker.addEventListener('message', () => {
        this.messageCount++;
      });
      
      // 监控错误
      this.worker.addEventListener('error', () => {
        this.errorCount++;
      });
    }
    
    getStatus() {
      return {
        uptime: Date.now() - this.startTime,
        messageCount: this.messageCount,
        errorCount: this.errorCount,
        errorRate: this.messageCount > 0 ? this.errorCount / this.messageCount : 0
      };
    }
  }
  
  // 使用监控器
  const monitor = new WorkerMonitor(worker);
  
  // 定期报告状态
  setInterval(() => {
    console.log('Worker status:', monitor.getStatus());
  }, 10000);
}

// Worker代码
// debug-worker.js
// Worker内部的错误处理和调试

// 1. 全局错误处理
self.onerror = (message, source, lineno, colno, error) => {
  console.error('Worker global error:', {
    message,
    source,
    lineno,
    colno,
    error: error ? error.stack : 'No error object'
  });
  
  // 发送错误到主线程
  self.postMessage({
    type: 'error',
    message,
    source,
    lineno,
    colno,
    stack: error ? error.stack : null
  });
  
  // 阻止默认错误处理
  return true;
};

// 2. 未处理的Promise拒绝
self.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection in worker:', event.reason);
  
  // 发送错误到主线程
  self.postMessage({
    type: 'unhandledRejection',
    reason: event.reason ? event.reason.toString() : 'Unknown reason',
    stack: event.reason && event.reason.stack ? event.reason.stack : null
  });
  
  // 阻止默认处理
  event.preventDefault();
};

// 3. 调试日志
function debugLog(message, data) {
  const timestamp = new Date().toISOString();
  console.log(\`[\${timestamp}] Worker: \${message}\`, data || '');
  
  // 可选：发送调试信息到主线程
  self.postMessage({
    type: 'debug',
    message,
    data,
    timestamp
  });
}

// 4. 安全的任务执行
function safeExecute(task) {
  try {
    debugLog('Executing task', task);
    
    // 验证任务
    if (!validateTask(task)) {
      throw new Error('Invalid task structure');
    }
    
    // 执行任务
    const result = executeTask(task);
    
    debugLog('Task completed successfully', { taskId: task.id });
    
    // 发送结果
    self.postMessage({
      type: 'result',
      taskId: task.id,
      result
    });
    
    return result;
  } catch (error) {
    debugLog('Task execution failed', {
      taskId: task.id,
      error: error.message,
      stack: error.stack
    });
    
    // 发送错误
    self.postMessage({
      type: 'taskError',
      taskId: task.id,
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

// 5. 性能监控
function performanceMonitor(operation) {
  const start = performance.now();
  
  return function(result) {
    const end = performance.now();
    const duration = end - start;
    
    debugLog(\`Performance: \${operation}\`, {
      duration: \`\${duration.toFixed(2)}ms\`
    });
    
    return result;
  };
}

// 6. 任务验证
function validateTask(task) {
  return (
    task &&
    typeof task === 'object' &&
    typeof task.id === 'string' &&
    typeof task.operation === 'string' &&
    ['compute', 'transform', 'filter'].includes(task.operation)
  );
}

// 7. 任务执行
function executeTask(task) {
  const { operation, parameters } = task;
  
  switch (operation) {
    case 'compute':
      return compute(parameters);
    case 'transform':
      return transform(parameters);
    case 'filter':
      return filter(parameters);
    default:
      throw new Error(\`Unknown operation: \${operation}\`);
  }
}

// 8. 带性能监控的操作
function compute(parameters) {
  return performanceMonitor('compute')(actualCompute(parameters));
}

function actualCompute(parameters) {
  // 实际计算逻辑
  const { iterations } = parameters;
  let result = 0;
  
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i);
  }
  
  return result;
}

// 监听消息
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'task':
      safeExecute(data);
      break;
      
    default:
      debugLog('Unknown message type', type);
  }
};
\`\`\`

## 结论

Web Workers为JavaScript提供了强大的多线程能力，使我们能够在后台线程中执行计算密集型任务，避免阻塞主线程，提高应用的响应性和性能。通过深入理解Web Workers的工作原理、通信机制和使用限制，我们可以构建更高效、更可靠的Web应用。

Web Workers的主要优势包括：

1. **非阻塞执行**：在后台线程中运行复杂计算，保持UI响应
2. **真正的并行性**：利用多核CPU实现真正的并行处理
3. **隔离性**：Worker运行在独立的全局作用域中，不会干扰主线程
4. **灵活的通信**：通过消息传递实现主线程与Worker之间的数据交换

同时，我们也需要注意Web Workers的限制和最佳实践：

1. **API限制**：Worker无法直接访问DOM和某些Web API
2. **通信开销**：消息传递有一定的性能开销
3. **安全考虑**：需要验证Worker来源和消息内容
4. **资源管理**：合理创建和终止Worker，避免资源泄漏

随着Web技术的发展，Web Workers的能力也在不断扩展，如SharedArrayBuffer和Atomics API提供了更高效的数据共享机制。掌握Web Workers技术，将帮助开发者构建更强大、更流畅的Web应用，充分利用现代浏览器的多核处理能力。

无论是处理大量数据、执行复杂计算，还是实现并行网络请求，Web Workers都是现代Web开发中不可或缺的工具。通过合理使用Web Workers，我们可以显著提升应用性能，提供更好的用户体验。`;export{n as default};
//# sourceMappingURL=11-DDBQ3ELs.js.map
