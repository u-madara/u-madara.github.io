const n=`---
title: "JavaScript Web Workers实际应用与高级特性"
excerpt: "深入探讨JavaScript Web Workers的实际应用场景与高级特性，包括图像处理、数据分析、网络请求与共享Worker等应用"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-09-17"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
categories: ["JavaScript"]
---

# JavaScript Web Workers与多线程编程 - 实际应用与高级特性

## 3. Web Workers实际应用

### 3.1 计算密集型任务

Web Workers最常见的用途是处理计算密集型任务，避免阻塞主线程。

#### 图像处理

\`\`\`javascript
// 图像处理Worker
// image-processing-worker.js
self.onmessage = (event) => {
  const { imageData, operation } = event.data;
  
  let processedData;
  
  switch (operation) {
    case 'grayscale':
      processedData = applyGrayscale(imageData);
      break;
    case 'blur':
      processedData = applyBlur(imageData);
      break;
    case 'sharpen':
      processedData = applySharpen(imageData);
      break;
    case 'edgeDetect':
      processedData = applyEdgeDetection(imageData);
      break;
    default:
      throw new Error(\`Unknown operation: \${operation}\`);
  }
  
  // 发送处理后的图像数据
  self.postMessage({
    type: 'result',
    imageData: processedData
  });
};

// 灰度转换
function applyGrayscale(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // 创建新的ImageData对象
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // 处理每个像素
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // 计算灰度值
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    outputData[i] = gray;     // R
    outputData[i + 1] = gray; // G
    outputData[i + 2] = gray; // B
    outputData[i + 3] = a;    // A
  }
  
  return output;
}

// 模糊效果
function applyBlur(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // 创建新的ImageData对象
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // 模糊核大小
  const kernelSize = 5;
  const kernel = createBlurKernel(kernelSize);
  
  // 应用模糊
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      // 应用卷积核
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const px = Math.min(Math.max(x + kx - Math.floor(kernelSize / 2), 0), width - 1);
          const py = Math.min(Math.max(y + ky - Math.floor(kernelSize / 2), 0), height - 1);
          
          const idx = (py * width + px) * 4;
          const weight = kernel[ky][kx];
          
          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
          a += data[idx + 3] * weight;
        }
      }
      
      const idx = (y * width + x) * 4;
      outputData[idx] = r;
      outputData[idx + 1] = g;
      outputData[idx + 2] = b;
      outputData[idx + 3] = a;
    }
  }
  
  return output;
}

// 创建模糊核
function createBlurKernel(size) {
  const kernel = [];
  const center = Math.floor(size / 2);
  let sum = 0;
  
  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 高斯模糊核
      kernel[y][x] = Math.exp(-(distance * distance) / (2 * 1.5 * 1.5));
      sum += kernel[y][x];
    }
  }
  
  // 归一化
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }
  
  return kernel;
}

// 锐化效果
function applySharpen(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // 创建新的ImageData对象
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // 锐化核
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];
  
  // 应用卷积核
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const px = x + kx - 1;
          const py = y + ky - 1;
          const idx = (py * width + px) * 4;
          const weight = kernel[ky][kx];
          
          r += data[idx] * weight;
          g += data[idx + 1] * weight;
          b += data[idx + 2] * weight;
        }
      }
      
      const idx = (y * width + x) * 4;
      outputData[idx] = Math.min(255, Math.max(0, r));
      outputData[idx + 1] = Math.min(255, Math.max(0, g));
      outputData[idx + 2] = Math.min(255, Math.max(0, b));
      outputData[idx + 3] = data[idx + 3]; // 保持原始alpha
    }
  }
  
  return output;
}

// 边缘检测
function applyEdgeDetection(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // 创建新的ImageData对象
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // Sobel算子
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  
  // 应用Sobel算子
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let pixelX = 0;
      let pixelY = 0;
      
      // 计算梯度
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const px = x + kx - 1;
          const py = y + ky - 1;
          const idx = (py * width + px) * 4;
          
          // 转换为灰度
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          
          pixelX += gray * sobelX[ky][kx];
          pixelY += gray * sobelY[ky][kx];
        }
      }
      
      // 计算梯度幅度
      const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
      const idx = (y * width + x) * 4;
      
      // 设置边缘像素
      const edge = magnitude > 50 ? 255 : 0;
      outputData[idx] = edge;
      outputData[idx + 1] = edge;
      outputData[idx + 2] = edge;
      outputData[idx + 3] = 255; // 不透明
    }
  }
  
  return output;
}

// 主线程使用示例
function imageProcessingExample() {
  const canvas = document.getElementById('imageCanvas');
  const ctx = canvas.getContext('2d');
  
  // 加载图像
  const img = new Image();
  img.crossOrigin = 'anonymous'; // 允许跨域图像
  img.onload = () => {
    // 绘制图像到canvas
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 创建图像处理Worker
    const worker = new Worker('image-processing-worker.js');
    
    // 显示处理状态
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Processing image...';
    
    // 接收处理结果
    worker.onmessage = (event) => {
      if (event.data.type === 'result') {
        // 显示处理后的图像
        ctx.putImageData(event.data.imageData, 0, 0);
        statusElement.textContent = 'Image processing complete';
      }
    };
    
    // 发送图像数据到Worker
    worker.postMessage({
      imageData,
      operation: 'grayscale' // 可以是 'grayscale', 'blur', 'sharpen', 'edgeDetect'
    });
  };
  
  img.src = 'https://picsum.photos/seed/image123/800/600.jpg';
}
\`\`\`

#### 数据分析

\`\`\`javascript
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

// 计算基本统计量
function calculateStatistics(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid data for statistics calculation');
  }
  
  // 排序数据
  const sortedData = [...data].sort((a, b) => a - b);
  const n = sortedData.length;
  
  // 计算总和
  const sum = sortedData.reduce((acc, val) => acc + val, 0);
  
  // 计算平均值
  const mean = sum / n;
  
  // 计算中位数
  const median = n % 2 === 0
    ? (sortedData[n / 2 - 1] + sortedData[n / 2]) / 2
    : sortedData[Math.floor(n / 2)];
  
  // 计算众数
  const frequency = {};
  let maxFrequency = 0;
  let mode = sortedData[0];
  
  for (const value of sortedData) {
    frequency[value] = (frequency[value] || 0) + 1;
    if (frequency[value] > maxFrequency) {
      maxFrequency = frequency[value];
      mode = value;
    }
  }
  
  // 计算方差和标准差
  let sumSquaredDifferences = 0;
  for (const value of sortedData) {
    sumSquaredDifferences += Math.pow(value - mean, 2);
  }
  
  const variance = sumSquaredDifferences / n;
  const standardDeviation = Math.sqrt(variance);
  
  // 计算四分位数
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sortedData[q1Index];
  const q3 = sortedData[q3Index];
  
  // 计算极差和四分位距
  const range = sortedData[n - 1] - sortedData[0];
  const iqr = q3 - q1;
  
  return {
    count: n,
    sum,
    mean,
    median,
    mode,
    variance,
    standardDeviation,
    min: sortedData[0],
    max: sortedData[n - 1],
    range,
    q1,
    q3,
    iqr
  };
}

// 计算相关系数
function calculateCorrelation(data) {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Invalid data for correlation calculation');
  }
  
  // 假设data是二维数组，每对值表示(x, y)
  const n = data.length;
  
  // 计算x和y的平均值
  const sumX = data.reduce((sum, pair) => sum + pair[0], 0);
  const sumY = data.reduce((sum, pair) => sum + pair[1], 0);
  
  const meanX = sumX / n;
  const meanY = sumY / n;
  
  // 计算相关系数的分子和分母
  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;
  
  for (const [x, y] of data) {
    const deltaX = x - meanX;
    const deltaY = y - meanY;
    
    numerator += deltaX * deltaY;
    sumXSquared += deltaX * deltaX;
    sumYSquared += deltaY * deltaY;
  }
  
  // 计算皮尔逊相关系数
  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  const correlation = denominator === 0 ? 0 : numerator / denominator;
  
  return {
    correlation,
    correlationSquared: correlation * correlation,
    sampleSize: n
  };
}

// 执行线性回归
function performRegression(data) {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Invalid data for regression analysis');
  }
  
  // 假设data是二维数组，每对值表示(x, y)
  const n = data.length;
  
  // 计算必要的总和
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  
  for (const [x, y] of data) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }
  
  // 计算斜率和截距
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

通过以上内容，我们了解了Web Workers的实际应用场景和高级特性。在下一部分中，我们将探讨Web Workers的限制、安全考虑和最佳实践。`;export{n as default};
//# sourceMappingURL=11-2-DjQLIwCR.js.map
