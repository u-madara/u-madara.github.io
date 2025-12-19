const n=`---
title: "JavaScript异步编程实际应用场景与最佳实践"
excerpt: "深入探讨JavaScript异步编程在实际项目中的应用场景，包括数据获取与状态管理、文件处理与上传、实时数据与WebSocket等技术，以及性能优化与资源管理的最佳实践"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-08-27"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# JavaScript异步编程实际应用场景与最佳实践

## 引言

在前面的文章中，我们探讨了JavaScript异步编程的演进历程、事件循环机制、高级异步模式和错误处理技巧。本文将深入探讨JavaScript异步编程在实际项目中的应用场景，包括数据获取与状态管理、文件处理与上传、实时数据与WebSocket等技术，以及性能优化与资源管理的最佳实践。

## 1. 数据获取与状态管理

### 1.1 React数据获取Hook

\`\`\`javascript
// 自定义数据获取Hook
function useData(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(\`HTTP error: \${response.status}\`);
        }
        
        const result = await response.json();
        
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [url]);
  
  return { data, loading, error };
}

// 使用数据获取Hook
function UserProfile({ userId }) {
  const { data: user, loading, error } = useData(\`/api/users/\${userId}\`);
  
  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!user) return <div>用户不存在</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
\`\`\`

### 1.2 请求缓存与去重

\`\`\`javascript
// 请求缓存与去重类
class RequestCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }
  
  async get(key, fetcher, ttl = 60000) {
    // 检查缓存
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    // 检查是否有正在进行的相同请求
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    // 发起新请求
    const promise = fetcher()
      .then(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// 使用请求缓存
const requestCache = new RequestCache();

async function getUser(id) {
  return requestCache.get(
    \`user:\${id}\`,
    () => fetch(\`/api/users/\${id}\`).then(res => res.json())
  );
}
\`\`\`

## 2. 文件处理与上传

### 2.1 分片文件上传

\`\`\`javascript
// 分片文件上传
class FileUploader {
  constructor(file, chunkSize = 1024 * 1024) { // 默认1MB分片
    this.file = file;
    this.chunkSize = chunkSize;
    this.chunks = Math.ceil(file.size / chunkSize);
    this.uploadedChunks = new Set();
    this.onProgress = () => {};
    this.onComplete = () => {};
    this.onError = () => {};
  }
  
  async upload(uploadUrl) {
    try {
      // 获取已上传的分片信息（如果支持断点续传）
      const uploadedInfo = await this.getUploadedChunks(uploadUrl);
      this.uploadedChunks = new Set(uploadedInfo.chunks);
      
      // 并行上传未完成的分片
      const uploadPromises = [];
      
      for (let i = 0; i < this.chunks; i++) {
        if (!this.uploadedChunks.has(i)) {
          uploadPromises.push(this.uploadChunk(uploadUrl, i));
        }
      }
      
      await Promise.all(uploadPromises);
      
      // 通知服务器合并分片
      await this.completeUpload(uploadUrl);
      
      this.onComplete();
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }
  
  async uploadChunk(uploadUrl, chunkIndex) {
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);
    const chunk = this.file.slice(start, end);
    
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('chunkIndex', chunkIndex);
    formData.append('totalChunks', this.chunks);
    formData.append('fileName', this.file.name);
    
    await fetch(\`\${uploadUrl}/chunk\`, {
      method: 'POST',
      body: formData
    });
    
    this.uploadedChunks.add(chunkIndex);
    this.onProgress(this.uploadedChunks.size / this.chunks);
  }
  
  async getUploadedChunks(uploadUrl) {
    try {
      const response = await fetch(\`\${uploadUrl}/status?fileName=\${this.file.name}\`);
      return response.json();
    } catch {
      return { chunks: [] }; // 如果不支持断点续传，返回空数组
    }
  }
  
  async completeUpload(uploadUrl) {
    return fetch(\`\${uploadUrl}/complete\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: this.file.name,
        totalChunks: this.chunks
      })
    });
  }
}

// 使用文件上传器
const fileInput = document.getElementById('file-input');
const progressBar = document.getElementById('progress-bar');

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const uploader = new FileUploader(file);
  
  uploader.onProgress = (progress) => {
    progressBar.style.width = \`\${progress * 100}%\`;
  };
  
  uploader.onComplete = () => {
    console.log('文件上传完成');
  };
  
  uploader.onError = (error) => {
    console.error('上传失败:', error);
  };
  
  await uploader.upload('/api/upload');
});
\`\`\`

### 2.2 文件拖放上传

\`\`\`javascript
// 文件拖放上传
class DragDropUploader {
  constructor(dropZone, options = {}) {
    this.dropZone = dropZone;
    this.options = {
      multiple: options.multiple || false,
      accept: options.accept || '*',
      maxSize: options.maxSize || 10 * 1024 * 1024, // 默认10MB
      ...options
    };
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // 防止默认拖放行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });
    
    // 高亮拖放区域
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, this.unhighlight, false);
    });
    
    // 处理文件拖放
    this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
  }
  
  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  highlight() {
    this.dropZone.classList.add('highlight');
  }
  
  unhighlight() {
    this.dropZone.classList.remove('highlight');
  }
  
  async handleDrop(e) {
    const files = e.dataTransfer.files;
    
    if (!this.options.multiple && files.length > 1) {
      alert('只支持单个文件上传');
      return;
    }
    
    for (const file of files) {
      if (!this.validateFile(file)) {
        continue;
      }
      
      await this.uploadFile(file);
    }
  }
  
  validateFile(file) {
    // 检查文件类型
    if (this.options.accept !== '*' && !file.type.match(this.options.accept)) {
      alert(\`不支持的文件类型: \${file.type}\`);
      return false;
    }
    
    // 检查文件大小
    if (file.size > this.options.maxSize) {
      alert(\`文件过大: \${file.size} bytes (最大: \${this.options.maxSize} bytes)\`);
      return false;
    }
    
    return true;
  }
  
  async uploadFile(file) {
    const uploader = new FileUploader(file);
    
    if (this.options.onProgress) {
      uploader.onProgress = this.options.onProgress;
    }
    
    if (this.options.onComplete) {
      uploader.onComplete = () => this.options.onComplete(file);
    }
    
    if (this.options.onError) {
      uploader.onError = this.options.onError;
    }
    
    await uploader.upload(this.options.uploadUrl || '/api/upload');
  }
}

// 使用拖放上传
const dropZone = document.getElementById('drop-zone');
const dragDropUploader = new DragDropUploader(dropZone, {
  accept: 'image/*',
  maxSize: 5 * 1024 * 1024, // 5MB
  onProgress: (progress) => {
    console.log(\`上传进度: \${Math.round(progress * 100)}%\`);
  },
  onComplete: (file) => {
    console.log(\`文件上传完成: \${file.name}\`);
  },
  onError: (error) => {
    console.error('上传失败:', error);
  }
});
\`\`\`

## 3. 实时数据与WebSocket

### 3.1 WebSocket管理器

\`\`\`javascript
// WebSocket管理器
class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options
    };
    
    this.ws = null;
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    this.eventHandlers = {
      open: [],
      message: [],
      error: [],
      close: []
    };
    
    this.connect();
  }
  
  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.scheduleReconnect();
    }
  }
  
  setupEventListeners() {
    this.ws.onopen = () => {
      console.log('WebSocket连接已建立');
      this.reconnectAttempts = 0;
      
      // 发送队列中的消息
      this.flushMessageQueue();
      
      this.eventHandlers.open.forEach(handler => handler());
    };
    
    this.ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        data = event.data;
      }
      
      this.eventHandlers.message.forEach(handler => handler(data));
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
      this.eventHandlers.error.forEach(handler => handler(error));
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket连接已关闭');
      this.eventHandlers.close.forEach(handler => handler());
      
      // 尝试重连
      this.scheduleReconnect();
    };
  }
  
  scheduleReconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(\`尝试重连 (\${this.reconnectAttempts}/\${this.options.maxReconnectAttempts})...\`);
      
      setTimeout(() => {
        this.connect();
      }, this.options.reconnectInterval);
    } else {
      console.error('已达到最大重连次数');
    }
  }
  
  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // 连接未就绪，将消息加入队列
      this.messageQueue.push(message);
    }
  }
  
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }
  
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }
  
  off(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }
  
  close() {
    this.options.maxReconnectAttempts = 0; // 防止重连
    if (this.ws) {
      this.ws.close();
    }
  }
}

// 使用WebSocket管理器
const wsManager = new WebSocketManager('wss://api.example.com/realtime');

wsManager.on('message', (data) => {
  console.log('收到消息:', data);
  
  if (data.type === 'notification') {
    showNotification(data.content);
  } else if (data.type === 'data_update') {
    updateUI(data.payload);
  }
});

wsManager.on('error', (error) => {
  console.error('WebSocket错误:', error);
  showConnectionError();
});
\`\`\`

### 3.2 实时协作编辑

\`\`\`javascript
// 实时协作编辑
class CollaborativeEditor {
  constructor(editorElement, documentId) {
    this.editor = editorElement;
    this.documentId = documentId;
    this.wsManager = new WebSocketManager(\`wss://api.example.com/collab/\${documentId}\`);
    this.localChanges = [];
    this.remoteChanges = [];
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // 监听本地编辑
    this.editor.addEventListener('input', this.handleLocalChange.bind(this));
    
    // 监听远程更改
    this.wsManager.on('message', this.handleRemoteChange.bind(this));
  }
  
  handleLocalChange(event) {
    const change = {
      type: 'text_change',
      position: this.editor.selectionStart,
      content: this.editor.value,
      timestamp: Date.now()
    };
    
    this.localChanges.push(change);
    this.wsManager.send(change);
  }
  
  handleRemoteChange(data) {
    if (data.type === 'text_change') {
      // 应用远程更改
      this.applyRemoteChange(data);
    } else if (data.type === 'cursor_position') {
      // 显示其他用户的 cursor
      this.updateRemoteCursor(data);
    }
  }
  
  applyRemoteChange(change) {
    // 保存当前光标位置
    const cursorPosition = this.editor.selectionStart;
    
    // 应用更改
    this.editor.value = change.content;
    
    // 恢复光标位置（考虑远程更改的影响）
    const newPosition = this.calculateNewCursorPosition(cursorPosition, change);
    this.editor.setSelectionRange(newPosition, newPosition);
  }
  
  calculateNewCursorPosition(currentPosition, remoteChange) {
    // 简化版本：实际实现需要更复杂的算法
    return currentPosition;
  }
  
  updateRemoteCursor(data) {
    // 显示远程用户的光标位置
    // 实际实现需要创建DOM元素表示远程光标
  }
  
  sendCursorPosition() {
    this.wsManager.send({
      type: 'cursor_position',
      position: this.editor.selectionStart,
      userId: this.getCurrentUserId()
    });
  }
}
\`\`\`

### 3.3 实时数据同步

\`\`\`javascript
// 实时数据同步
class RealtimeDataSync {
  constructor(apiUrl, wsUrl) {
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
    this.localData = new Map();
    this.pendingUpdates = new Map();
    this.conflictResolver = this.defaultConflictResolver;
    
    this.setupWebSocket();
  }
  
  async setupWebSocket() {
    this.wsManager = new WebSocketManager(this.wsUrl);
    
    this.wsManager.on('message', (data) => {
      this.handleRemoteUpdate(data);
    });
  }
  
  async get(key) {
    // 首先检查本地数据
    if (this.localData.has(key)) {
      return this.localData.get(key);
    }
    
    // 从服务器获取
    try {
      const response = await fetch(\`\${this.apiUrl}/data/\${key}\`);
      const data = await response.json();
      
      this.localData.set(key, data);
      return data;
    } catch (error) {
      console.error('获取数据失败:', error);
      throw error;
    }
  }
  
  async set(key, value) {
    // 更新本地数据
    this.localData.set(key, value);
    
    // 标记为待同步
    this.pendingUpdates.set(key, {
      value,
      timestamp: Date.now(),
      version: (this.pendingUpdates.get(key)?.version || 0) + 1
    });
    
    // 通知服务器
    this.wsManager.send({
      type: 'update',
      key,
      value,
      timestamp: Date.now(),
      version: this.pendingUpdates.get(key).version
    });
  }
  
  handleRemoteUpdate(data) {
    if (data.type === 'update') {
      const { key, value, timestamp, version } = data;
      const pendingUpdate = this.pendingUpdates.get(key);
      
      // 检查是否有冲突
      if (pendingUpdate && pendingUpdate.timestamp > timestamp) {
        // 本地更新更新，忽略远程更新
        return;
      }
      
      if (pendingUpdate && pendingUpdate.timestamp < timestamp) {
        // 远程更新更新，解决冲突
        const resolvedValue = this.conflictResolver(
          this.localData.get(key),
          value,
          pendingUpdate.value
        );
        
        this.localData.set(key, resolvedValue);
        this.pendingUpdates.delete(key);
        
        // 通知UI更新
        this.notifyUpdate(key, resolvedValue);
      } else {
        // 没有冲突，直接应用远程更新
        this.localData.set(key, value);
        this.notifyUpdate(key, value);
      }
    }
  }
  
  defaultConflictResolver(localValue, remoteValue, pendingValue) {
    // 默认冲突解决策略：使用时间戳最新的值
    // 实际应用中可能需要更复杂的逻辑
    return pendingValue;
  }
  
  notifyUpdate(key, value) {
    // 通知UI更新
    const event = new CustomEvent('dataUpdate', {
      detail: { key, value }
    });
    document.dispatchEvent(event);
  }
}
\`\`\`

## 4. 性能优化与最佳实践

### 4.1 批量异步操作优化

\`\`\`javascript
// 批量异步操作优化
async function batchProcess(items, processor, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    
    results.push(...batchResults);
    
    // 让出控制权，避免阻塞UI
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}

// 使用示例
const users = await fetchUsers();
const processedUsers = await batchProcess(
  users,
  user => processUserData(user),
  20 // 每批处理20个用户
);
\`\`\`

### 4.2 请求优化器

\`\`\`javascript
// 请求优化器
class RequestOptimizer {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }
  
  async request(key, fetcher, ttl = 60000) {
    // 检查缓存
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    // 检查是否有正在进行的相同请求
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    // 发起新请求
    const promise = fetcher()
      .then(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
  
  // 预加载资源
  async preload(keys, fetcher) {
    const preloadPromises = keys.map(key => 
      this.request(key, () => fetcher(key)).catch(error => {
        console.warn(\`预加载失败 \${key}:\`, error);
        return null;
      })
    );
    
    return Promise.allSettled(preloadPromises);
  }
  
  // 清理过期缓存
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 300000) { // 5分钟过期
        this.cache.delete(key);
      }
    }
  }
}

// 使用请求优化器
const requestOptimizer = new RequestOptimizer();

// 定期清理缓存
setInterval(() => requestOptimizer.cleanup(), 60000);
\`\`\`

### 4.3 智能重试与退避策略

\`\`\`javascript
// 智能重试与退避策略
class SmartRetry {
  constructor(options = {}) {
    this.options = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      ...options
    };
  }
  
  async execute(fn, context = null) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await fn.call(context);
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }
        
        // 计算延迟时间
        const delay = this.calculateDelay(attempt);
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  shouldRetry(error, attempt) {
    // 达到最大重试次数
    if (attempt >= this.options.maxAttempts) {
      return false;
    }
    
    // 根据错误类型决定是否重试
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true; // 网络错误可以重试
    }
    
    if (error.status >= 500) {
      return true; // 服务器错误可以重试
    }
    
    if (error.status === 429) {
      return true; // 限流错误可以重试
    }
    
    return false; // 其他错误不重试
  }
  
  calculateDelay(attempt) {
    // 指数退避
    let delay = this.options.baseDelay * Math.pow(this.options.backoffFactor, attempt - 1);
    
    // 限制最大延迟
    delay = Math.min(delay, this.options.maxDelay);
    
    // 添加随机抖动，避免雷群效应
    if (this.options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return delay;
  }
}

// 使用智能重试
const smartRetry = new SmartRetry({
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 10000
});

async function robustFetch(url, options) {
  return smartRetry.execute(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = new Error(\`HTTP error: \${response.status}\`);
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  });
}
\`\`\`

## 5. 内存管理与资源释放

### 5.1 异步资源管理器

\`\`\`javascript
// 异步资源管理器
class AsyncResourceManager {
  constructor() {
    this.resources = new Set();
  }
  
  register(resource) {
    this.resources.add(resource);
    return resource;
  }
  
  unregister(resource) {
    this.resources.delete(resource);
  }
  
  async releaseAll() {
    const releasePromises = Array.from(this.resources).map(async resource => {
      try {
        if (typeof resource.close === 'function') {
          await resource.close();
        } else if (typeof resource.abort === 'function') {
          resource.abort();
        } else if (typeof resource.destroy === 'function') {
          await resource.destroy();
        }
      } catch (error) {
        console.error('释放资源失败:', error);
      }
    });
    
    await Promise.allSettled(releasePromises);
    this.resources.clear();
  }
}

// 使用资源管理器
const resourceManager = new AsyncResourceManager();

// 页面卸载时释放所有资源
window.addEventListener('beforeunload', () => {
  resourceManager.releaseAll();
});
\`\`\`

### 5.2 可取消的异步操作

\`\`\`javascript
// 可取消的异步操作
class CancellablePromise {
  constructor(executor) {
    this.isCancelled = false;
    this.cancelCallbacks = [];
    
    this.promise = new Promise((resolve, reject) => {
      executor(
        value => {
          if (!this.isCancelled) resolve(value);
        },
        error => {
          if (!this.isCancelled) reject(error);
        }
      );
    });
  }
  
  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }
  
  catch(onRejected) {
    return this.promise.catch(onRejected);
  }
  
  finally(onFinally) {
    return this.promise.finally(onFinally);
  }
  
  cancel() {
    this.isCancelled = true;
    this.cancelCallbacks.forEach(callback => callback());
    this.cancelCallbacks = [];
  }
  
  onCancel(callback) {
    this.cancelCallbacks.push(callback);
  }
}

// 创建可取消的fetch
function cancellableFetch(url, options) {
  const controller = new AbortController();
  const signal = controller.signal;
  
  const cancellablePromise = new CancellablePromise((resolve, reject) => {
    fetch(url, { ...options, signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(\`HTTP error: \${response.status}\`);
        }
        return response.json();
      })
      .then(resolve)
      .catch(reject);
  });
  
  cancellablePromise.onCancel(() => {
    controller.abort();
  });
  
  return cancellablePromise;
}

// 使用可取消的异步操作
const request = cancellableFetch('/api/data');

// 取消请求
request.cancel();
\`\`\`

### 5.3 内存泄漏防护

\`\`\`javascript
// 内存泄漏防护
class MemoryLeakGuard {
  constructor() {
    this.timers = new Set();
    this.listeners = new Map();
    this.observers = new Set();
  }
  
  // 定时器管理
  setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);
    
    this.timers.add(timerId);
    return timerId;
  }
  
  clearTimeout(timerId) {
    clearTimeout(timerId);
    this.timers.delete(timerId);
  }
  
  // 事件监听器管理
  addEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    
    if (!this.listeners.has(element)) {
      this.listeners.set(element, []);
    }
    
    this.listeners.get(element).push({ event, handler, options });
  }
  
  removeEventListener(element, event, handler) {
    element.removeEventListener(event, handler);
    
    if (this.listeners.has(element)) {
      const elementListeners = this.listeners.get(element);
      const index = elementListeners.findIndex(
        listener => listener.event === event && listener.handler === handler
      );
      
      if (index > -1) {
        elementListeners.splice(index, 1);
      }
    }
  }
  
  // 观察者管理
  addObserver(observer) {
    this.observers.add(observer);
    return observer;
  }
  
  removeObserver(observer) {
    if (observer && typeof observer.disconnect === 'function') {
      observer.disconnect();
    }
    this.observers.delete(observer);
  }
  
  // 清理所有资源
  cleanup() {
    // 清理定时器
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers.clear();
    
    // 清理事件监听器
    this.listeners.forEach((elementListeners, element) => {
      elementListeners.forEach(({ event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.listeners.clear();
    
    // 清理观察者
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();
  }
}

// 使用内存泄漏防护
const memoryGuard = new MemoryLeakGuard();

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  memoryGuard.cleanup();
});
\`\`\`

## 结论

JavaScript异步编程在实际应用中有多种场景，从数据获取与状态管理到文件处理与上传，再到实时数据与WebSocket通信。掌握这些实际应用场景的最佳实践，可以帮助我们构建更高效、更可靠的应用程序。

通过批量处理、请求优化、智能重试等技术，我们可以显著提升异步操作的性能。同时，合理的内存管理和资源释放机制可以避免内存泄漏，确保应用的长期稳定运行。

在下一篇文章中，我们将探讨JavaScript异步编程的未来发展与趋势，了解新兴的异步API和编程模式。`;export{n as default};
//# sourceMappingURL=07-5-25eJs47M.js.map
