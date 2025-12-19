const n=`---
title: "JavaScript事件循环与任务队列详解"
excerpt: "深入解析JavaScript事件循环机制，探讨宏任务与微任务的区别及执行顺序，帮助理解异步操作的核心原理"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-08-24"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# JavaScript事件循环与任务队列详解

## 引言

JavaScript作为单线程语言，却能够高效处理异步操作，这得益于其精妙的事件循环机制和不断演进的异步编程模型。在上一篇文章中，我们探讨了JavaScript异步编程的演进历程，从回调函数到Promise再到async/await的发展。本文将深入探讨JavaScript的事件循环机制，理解异步操作背后的核心原理。

## 1. 事件循环机制

JavaScript的异步能力基于事件循环（Event Loop）机制，理解它对掌握异步编程至关重要：

\`\`\`javascript
// 事件循环示例
console.log('开始');

setTimeout(() => console.log('定时器'), 0);

Promise.resolve().then(() => console.log('Promise'));

console.log('结束');

// 输出顺序：
// 开始
// 结束
// Promise
// 定时器
\`\`\`

事件循环的工作原理：
1. 执行全局脚本代码（宏任务）
2. 执行完当前宏任务后，检查微任务队列
3. 执行所有微任务，直到微任务队列为空
4. 执行下一个宏任务
5. 重复步骤2-4

## 2. 宏任务与微任务

JavaScript中有两种任务队列：

\`\`\`javascript
// 宏任务（Macrotask）示例
setTimeout(() => console.log('宏任务1'), 0);
setInterval(() => console.log('间隔宏任务'), 1000);
setImmediate(() => console.log('立即宏任务')); // Node.js环境
requestAnimationFrame(() => console.log('动画帧宏任务'));
I/O操作、UI渲染等

// 微任务（Microtask）示例
Promise.resolve().then(() => console.log('微任务1'));
queueMicrotask(() => console.log('微任务2')); // 显式创建微任务
process.nextTick(() => console.log('nextTick微任务')); // Node.js环境
MutationObserver回调

// 任务执行顺序演示
console.log('同步代码1');

setTimeout(() => console.log('宏任务1'), 0);

Promise.resolve().then(() => {
  console.log('微任务1');
  Promise.resolve().then(() => console.log('微任务2'));
});

setTimeout(() => console.log('宏任务2'), 0);

console.log('同步代码2');

// 输出顺序：
// 同步代码1
// 同步代码2
// 微任务1
// 微任务2
// 宏任务1
// 宏任务2
\`\`\`

### 2.1 任务执行顺序详解

\`\`\`javascript
// 复杂任务执行顺序示例
console.log('脚本开始');

setTimeout(() => {
  console.log('setTimeout - 宏任务');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise - 微任务1');
  
  return Promise.resolve().then(() => {
    console.log('Promise内嵌 - 微任务2');
  });
});

Promise.resolve().then(() => {
  console.log('Promise - 微任务3');
});

console.log('脚本结束');

// 输出顺序：
// 脚本开始
// 脚本结束
// Promise - 微任务1
// Promise内嵌 - 微任务2
// Promise - 微任务3
// setTimeout - 宏任务
\`\`\`

### 2.2 微任务与宏任务的优先级

\`\`\`javascript
// 微任务优先级示例
console.log('开始');

setTimeout(() => console.log('宏任务1'), 0);

Promise.resolve().then(() => {
  console.log('微任务1');
  
  // 在微任务中添加新的微任务
  Promise.resolve().then(() => console.log('微任务2'));
  
  // 在微任务中添加宏任务
  setTimeout(() => console.log('宏任务2'), 0);
});

Promise.resolve().then(() => console.log('微任务3'));

console.log('结束');

// 输出顺序：
// 开始
// 结束
// 微任务1
// 微任务2
// 微任务3
// 宏任务1
// 宏任务2
\`\`\`

## 3. 浏览器与Node.js中的事件循环差异

### 3.1 浏览器环境中的事件循环

\`\`\`javascript
// 浏览器环境示例
console.log('开始');

setTimeout(() => console.log('定时器1'), 0);

Promise.resolve().then(() => console.log('Promise1'));

setTimeout(() => console.log('定时器2'), 0);

Promise.resolve().then(() => console.log('Promise2'));

// 浏览器输出：
// 开始
// Promise1
// Promise2
// 定时器1
// 定时器2
\`\`\`

### 3.2 Node.js环境中的事件循环

\`\`\`javascript
// Node.js环境示例
console.log('开始');

setTimeout(() => console.log('定时器1'), 0);

setImmediate(() => console.log('立即执行'));

Promise.resolve().then(() => console.log('Promise'));

process.nextTick(() => console.log('nextTick'));

// Node.js输出：
// 开始
// nextTick
// Promise
// 定时器1
// 立即执行
\`\`\`

Node.js的事件循环包含多个阶段：
1. Timers（定时器）
2. Pending callbacks（待定回调）
3. Idle, prepare（空闲、准备）
4. Poll（轮询）
5. Check（检查）
6. Close callbacks（关闭回调）

## 4. 实际应用中的注意事项

### 4.1 避免阻塞事件循环

\`\`\`javascript
// 错误示例：阻塞事件循环
function badBlockingOperation() {
  const start = Date.now();
  while (Date.now() - start < 5000) {
    // 模拟耗时操作，阻塞主线程
  }
  console.log('耗时操作完成');
}

// 正确示例：使用异步操作
function goodAsyncOperation() {
  return new Promise(resolve => {
    // 使用setTimeout将耗时操作分解
    const steps = 10;
    let currentStep = 0;
    
    function processStep() {
      // 模拟每一步耗时操作
      const start = Date.now();
      while (Date.now() - start < 500) {
        // 短暂操作，不会长时间阻塞
      }
      
      currentStep++;
      if (currentStep < steps) {
        // 使用setTimeout让出控制权
        setTimeout(processStep, 0);
      } else {
        resolve('操作完成');
      }
    }
    
    setTimeout(processStep, 0);
  });
}
\`\`\`

### 4.2 微任务队列的陷阱

\`\`\`javascript
// 微任务队列无限循环示例
let counter = 0;

function microtaskLoop() {
  counter++;
  
  if (counter < 1000) {
    // 在微任务中继续添加微任务
    Promise.resolve().then(microtaskLoop);
  } else {
    console.log('微任务循环结束');
  }
}

// 启动微任务循环
Promise.resolve().then(microtaskLoop);

// 注意：这会阻塞宏任务的执行，直到所有微任务完成
setTimeout(() => console.log('这个定时器可能需要等待很久'), 0);
\`\`\`

## 结论

理解JavaScript的事件循环机制对于编写高效的非阻塞代码至关重要。微任务和宏任务的执行顺序决定了异步代码的行为，合理使用这两种任务类型可以优化应用性能。

在下一篇文章中，我们将探讨JavaScript中的高级异步模式，包括并发控制、异步迭代和流式处理等技术。`;export{n as default};
//# sourceMappingURL=07-2-C5dOrynK.js.map
