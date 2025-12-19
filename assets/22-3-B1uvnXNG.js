const n=`---
title: "前端安全基础与XSS防护（三）：实际应用案例与总结"
excerpt: "通过实际应用案例展示XSS防护的具体实现，总结前端安全最佳实践和XSS防护的多层策略"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-11-02"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# 前端安全基础与XSS防护（三）：实际应用案例与总结

## 前言

在前两篇文章中，我们介绍了XSS攻击的原理、类型以及各种防护策略和检测工具。本文将通过实际应用案例展示XSS防护的具体实现，并总结前端安全最佳实践，帮助你构建更安全的前端应用。

## 实际应用案例

### 安全的评论系统

\`\`\`javascript
// 1. 客户端评论组件
class CommentSystem {
  constructor(container, postId) {
    this.container = container;
    this.postId = postId;
    this.comments = [];
    this.init();
  }
  
  init() {
    this.render();
    this.loadComments();
  }
  
  // 渲染评论表单和列表
  render() {
    this.container.innerHTML = \`
      <div class="comment-form">
        <h3>发表评论</h3>
        <form id="comment-form">
          <div class="form-group">
            <label for="comment-name">昵称:</label>
            <input type="text" id="comment-name" maxlength="50" required>
          </div>
          <div class="form-group">
            <label for="comment-email">邮箱:</label>
            <input type="email" id="comment-email" maxlength="100" required>
          </div>
          <div class="form-group">
            <label for="comment-content">评论内容:</label>
            <textarea id="comment-content" maxlength="500" required></textarea>
          </div>
          <button type="submit">提交评论</button>
        </form>
      </div>
      <div class="comment-list">
        <h3>评论列表</h3>
        <div id="comments-container"></div>
      </div>
    \`;
    
    // 绑定表单提交事件
    document.getElementById('comment-form').addEventListener('submit', this.handleSubmit.bind(this));
  }
  
  // 处理表单提交
  handleSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('comment-name').value;
    const email = document.getElementById('comment-email').value;
    const content = document.getElementById('comment-content').value;
    
    // 客户端验证
    if (!this.validateComment(name, email, content)) {
      return;
    }
    
    // 提交评论
    this.submitComment({
      name,
      email,
      content,
      postId: this.postId
    });
  }
  
  // 验证评论内容
  validateComment(name, email, content) {
    // 验证昵称
    if (!validateInput(name, 'a-zA-Z0-9\\u4e00-\\u9fa5 ._-')) {
      this.showError('昵称包含非法字符');
      return false;
    }
    
    if (name.length < 2 || name.length > 50) {
      this.showError('昵称长度应在2-50个字符之间');
      return false;
    }
    
    // 验证邮箱
    if (!validateEmail(email)) {
      this.showError('请输入有效的邮箱地址');
      return false;
    }
    
    // 验证内容
    if (content.length < 5 || content.length > 500) {
      this.showError('评论内容长度应在5-500个字符之间');
      return false;
    }
    
    return true;
  }
  
  // 提交评论到服务器
  async submitComment(commentData) {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCSRFToken()
        },
        body: JSON.stringify(commentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '提交评论失败');
      }
      
      const result = await response.json();
      
      // 清空表单
      document.getElementById('comment-form').reset();
      
      // 显示成功消息
      this.showSuccess('评论提交成功，等待审核');
      
      // 重新加载评论
      this.loadComments();
      
    } catch (error) {
      this.showError(error.message);
    }
  }
  
  // 加载评论列表
  async loadComments() {
    try {
      const response = await fetch(\`/api/comments?postId=\${this.postId}\`);
      
      if (!response.ok) {
        throw new Error('加载评论失败');
      }
      
      this.comments = await response.json();
      this.renderComments();
      
    } catch (error) {
      this.showError(error.message);
    }
  }
  
  // 渲染评论列表
  renderComments() {
    const container = document.getElementById('comments-container');
    
    if (this.comments.length === 0) {
      container.innerHTML = '<p>暂无评论</p>';
      return;
    }
    
    const commentsHtml = this.comments.map(comment => this.renderComment(comment)).join('');
    container.innerHTML = commentsHtml;
  }
  
  // 渲染单个评论
  renderComment(comment) {
    // 使用安全的DOM操作而不是innerHTML
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    
    // 创建头部信息
    const headerDiv = document.createElement('div');
    headerDiv.className = 'comment-header';
    
    const authorSpan = document.createElement('span');
    authorSpan.className = 'comment-author';
    authorSpan.textContent = comment.name; // 安全，自动转义
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'comment-time';
    timeSpan.textContent = new Date(comment.createdAt).toLocaleString(); // 安全，自动转义
    
    headerDiv.appendChild(authorSpan);
    headerDiv.appendChild(timeSpan);
    
    // 创建评论内容
    const contentDiv = document.createElement('div');
    contentDiv.className = 'comment-content';
    
    // 使用DOMPurify清理HTML内容，允许一些基本格式
    contentDiv.innerHTML = DOMPurify.sanitize(comment.content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: []
    });
    
    // 组装评论
    commentDiv.appendChild(headerDiv);
    commentDiv.appendChild(contentDiv);
    
    return commentDiv.outerHTML;
  }
  
  // 显示错误消息
  showError(message) {
    this.showMessage(message, 'error');
  }
  
  // 显示成功消息
  showSuccess(message) {
    this.showMessage(message, 'success');
  }
  
  // 显示消息
  showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = \`message message-\${type}\`;
    messageDiv.textContent = message; // 安全，自动转义
    
    // 插入到表单前面
    const form = document.getElementById('comment-form');
    form.parentNode.insertBefore(messageDiv, form);
    
    // 3秒后自动移除
    setTimeout(() => {
      messageDiv.parentNode.removeChild(messageDiv);
    }, 3000);
  }
}

// 2. 服务器端API实现
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const DOMPurify = require('isomorphic-dompurify');
const { body, validationResult } = require('express-validator');

const app = express();

// 安全中间件
app.use(helmet());
app.use(express.json());

// 速率限制 - 防止垃圾评论
const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个IP最多5条评论
  message: '评论过于频繁，请稍后再试'
});

// 评论提交API
app.post('/api/comments', 
  commentLimiter,
  [
    // 输入验证
    body('name')
      .isLength({ min: 2, max: 50 })
      .withMessage('昵称长度应在2-50个字符之间')
      .matches(/^[a-zA-Z0-9\\u4e00-\\u9fa5 ._-]+$/)
      .withMessage('昵称包含非法字符'),
    
    body('email')
      .isEmail()
      .withMessage('请输入有效的邮箱地址')
      .normalizeEmail(),
    
    body('content')
      .isLength({ min: 5, max: 500 })
      .withMessage('评论内容长度应在5-500个字符之间'),
    
    body('postId')
      .isInt({ min: 1 })
      .withMessage('无效的文章ID')
  ],
  async (req, res) => {
    // 验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }
    
    try {
      const { name, email, content, postId } = req.body;
      
      // 清理输入内容
      const cleanName = DOMPurify.sanitize(name);
      const cleanContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'blockquote', 'code', 'pre'],
        ALLOWED_ATTR: []
      });
      
      // 保存到数据库
      const comment = await db.Comment.create({
        name: cleanName,
        email,
        content: cleanContent,
        postId,
        status: 'pending', // 需要审核
        createdAt: new Date()
      });
      
      res.status(201).json({
        success: true,
        message: '评论提交成功，等待审核',
        comment: {
          id: comment.id,
          name: comment.name,
          content: comment.content,
          createdAt: comment.createdAt
        }
      });
      
    } catch (error) {
      console.error('提交评论失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

// 获取评论列表API
app.get('/api/comments', [
  query('postId')
    .isInt({ min: 1 })
    .withMessage('无效的文章ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('无效的页码'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量应在1-100之间')
], async (req, res) => {
  // 验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array()
    });
  }
  
  try {
    const postId = parseInt(req.query.postId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // 从数据库获取已审核的评论
    const comments = await db.Comment.findAll({
      where: {
        postId,
        status: 'approved'
      },
      order: [['createdAt', 'ASC']],
      limit,
      offset
    });
    
    // 获取总数
    const total = await db.Comment.count({
      where: {
        postId,
        status: 'approved'
      }
    });
    
    res.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 3. 管理员审核评论API
app.put('/api/comments/:id/approve', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('无效的评论ID')
], async (req, res) => {
  // 验证管理员身份
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '无权限执行此操作'
    });
  }
  
  // 验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array()
    });
  }
  
  try {
    const commentId = parseInt(req.params.id);
    
    // 更新评论状态
    const [updatedRowsCount] = await db.Comment.update(
      { status: 'approved' },
      {
        where: {
          id: commentId,
          status: 'pending'
        }
      }
    );
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在或已处理'
      });
    }
    
    res.json({
      success: true,
      message: '评论审核通过'
    });
    
  } catch (error) {
    console.error('审核评论失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 4. 删除评论API
app.delete('/api/comments/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('无效的评论ID')
], async (req, res) => {
  // 验证管理员身份
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '无权限执行此操作'
    });
  }
  
  // 验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '参数验证失败',
      errors: errors.array()
    });
  }
  
  try {
    const commentId = parseInt(req.params.id);
    
    // 删除评论
    const deletedRowsCount = await db.Comment.destroy({
      where: {
        id: commentId
      }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    res.json({
      success: true,
      message: '评论删除成功'
    });
    
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});
\`\`\`

### 富文本编辑器安全实现

\`\`\`javascript
// 1. 安全的富文本编辑器
class SecureRichTextEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
      allowedAttributes: {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'width', 'height']
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      ...options
    };
    
    this.init();
  }
  
  init() {
    this.createEditor();
    this.setupEventListeners();
  }
  
  createEditor() {
    this.container.innerHTML = \`
      <div class="rich-text-editor">
        <div class="editor-toolbar">
          <button type="button" data-command="bold"><strong>B</strong></button>
          <button type="button" data-command="italic"><em>I</em></button>
          <button type="button" data-command="underline"><u>U</u></button>
          <button type="button" data-command="insertUnorderedList">• List</button>
          <button type="button" data-command="insertOrderedList">1. List</button>
          <button type="button" data-command="createLink">Link</button>
          <button type="button" data-command="insertImage">Image</button>
          <button type="button" data-command="formatBlock" data-value="h2">H2</button>
          <button type="button" data-command="formatBlock" data-value="h3">H3</button>
          <button type="button" data-command="removeFormat">Clear</button>
        </div>
        <div class="editor-content" contenteditable="true"></div>
        <textarea class="editor-html" style="display:none;"></textarea>
      </div>
    \`;
    
    this.editorContent = this.container.querySelector('.editor-content');
    this.editorHtml = this.container.querySelector('.editor-html');
  }
  
  setupEventListeners() {
    // 工具栏按钮事件
    this.container.querySelectorAll('.editor-toolbar button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.executeCommand(button);
      });
    });
    
    // 编辑器内容变化事件
    this.editorContent.addEventListener('input', () => {
      this.updateHtmlTextarea();
    });
    
    // 粘贴事件 - 清理粘贴的HTML
    this.editorContent.addEventListener('paste', (e) => {
      e.preventDefault();
      this.handlePaste(e);
    });
    
    // 拖放事件 - 防止拖放文件
    this.editorContent.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleDrop(e);
    });
  }
  
  executeCommand(button) {
    const command = button.dataset.command;
    const value = button.dataset.value || null;
    
    if (command === 'createLink') {
      const url = prompt('请输入链接地址:');
      if (url) {
        document.execCommand(command, false, this.sanitizeUrl(url));
      }
    } else if (command === 'insertImage') {
      const url = prompt('请输入图片地址:');
      if (url) {
        document.execCommand(command, false, this.sanitizeUrl(url));
      }
    } else {
      document.execCommand(command, false, value);
    }
    
    this.updateHtmlTextarea();
  }
  
  handlePaste(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');
    
    if (html) {
      // 清理HTML内容
      const cleanHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: this.options.allowedTags,
        ALLOWED_ATTR: this.options.allowedAttributes
      });
      
      // 插入清理后的HTML
      document.execCommand('insertHTML', false, cleanHtml);
    } else if (text) {
      // 插入纯文本
      document.execCommand('insertText', false, text);
    }
    
    this.updateHtmlTextarea();
  }
  
  handleDrop(e) {
    const types = e.dataTransfer.types;
    
    // 检查是否有文件
    if (types.includes('Files')) {
      // 可以在这里处理文件上传
      return;
    }
    
    // 处理HTML或文本拖放
    const html = e.dataTransfer.getData('text/html');
    const text = e.dataTransfer.getData('text/plain');
    
    if (html) {
      const cleanHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: this.options.allowedTags,
        ALLOWED_ATTR: this.options.allowedAttributes
      });
      
      document.execCommand('insertHTML', false, cleanHtml);
    } else if (text) {
      document.execCommand('insertText', false, text);
    }
    
    this.updateHtmlTextarea();
  }
  
  sanitizeUrl(url) {
    // 验证URL协议
    try {
      const parsedUrl = new URL(url);
      
      if (!this.options.allowedSchemes.includes(parsedUrl.protocol.replace(':', ''))) {
        return '#'; // 不允许的协议，返回安全URL
      }
      
      return url;
    } catch (error) {
      // URL解析失败，可能是相对路径
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return url; // 允许相对路径
      }
      
      return '#'; // 无效URL，返回安全URL
    }
  }
  
  updateHtmlTextarea() {
    // 获取编辑器内容并清理
    const html = this.editorContent.innerHTML;
    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: this.options.allowedTags,
      ALLOWED_ATTR: this.options.allowedAttributes
    });
    
    this.editorHtml.value = cleanHtml;
  }
  
  // 获取清理后的HTML内容
  getCleanHtml() {
    this.updateHtmlTextarea();
    return this.editorHtml.value;
  }
  
  // 设置内容
  setContent(html) {
    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: this.options.allowedTags,
      ALLOWED_ATTR: this.options.allowedAttributes
    });
    
    this.editorContent.innerHTML = cleanHtml;
    this.updateHtmlTextarea();
  }
}

// 2. 服务器端富文本内容处理
const express = require('express');
const DOMPurify = require('isomorphic-dompurify');
const { JSDOM } = require('jsdom');

// 富文本内容提交处理
app.post('/api/articles', [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('标题长度应在5-200个字符之间'),
  body('content')
    .isLength({ min: 10 })
    .withMessage('内容至少需要10个字符'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('摘要长度不能超过500个字符')
], async (req, res) => {
  // 验证结果
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array()
    });
  }
  
  try {
    const { title, content, excerpt } = req.body;
    
    // 清理标题和摘要
    const cleanTitle = DOMPurify.sanitize(title, { ALLOWED_TAGS: [] });
    const cleanExcerpt = excerpt ? DOMPurify.sanitize(excerpt, { ALLOWED_TAGS: [] }) : '';
    
    // 清理内容，允许更多HTML标签
    const cleanContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'blockquote', 'code', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'div', 'span',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'width', 'height', 'style'],
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan'],
        'div': ['class'],
        'span': ['class'],
        'code': ['class'],
        'pre': ['class']
      },
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\\-]+(?:[^a-z+.\\-:]|$))/i
    });
    
    // 进一步处理内容，例如提取图片、添加安全属性等
    const processedContent = processRichTextContent(cleanContent);
    
    // 保存到数据库
    const article = await db.Article.create({
      title: cleanTitle,
      content: processedContent,
      excerpt: cleanExcerpt,
      authorId: req.user.id,
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: '文章创建成功',
      article: {
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        createdAt: article.createdAt
      }
    });
    
  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 处理富文本内容
function processRichTextContent(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // 处理所有链接，添加安全属性
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    
    if (href) {
      // 外部链接添加rel="noopener noreferrer"
      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        link.setAttribute('rel', 'noopener noreferrer');
        link.setAttribute('target', '_blank');
      }
    }
  });
  
  // 处理所有图片，添加安全属性
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const src = img.getAttribute('src');
    
    if (src) {
      // 添加loading="lazy"属性
      img.setAttribute('loading', 'lazy');
      
      // 如果没有alt属性，添加空alt
      if (!img.hasAttribute('alt')) {
        img.setAttribute('alt', '');
      }
    }
  });
  
  // 处理代码块，添加复制按钮
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    const pre = block.parentNode;
    
    // 创建复制按钮
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = '复制';
    copyButton.setAttribute('data-clipboard-text', block.textContent);
    
    // 添加复制功能
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        copyButton.textContent = '已复制';
        setTimeout(() => {
          copyButton.textContent = '复制';
        }, 2000);
      });
    });
    
    // 将按钮添加到代码块前面
    pre.insertBefore(copyButton, block);
  });
  
  // 返回处理后的HTML
  return dom.serialize();
}
\`\`\`

## 前端安全最佳实践

### 1. 输入验证与过滤

\`\`\`javascript
// 综合输入验证函数
function validateAndSanitizeInput(input, rules) {
  let sanitized = input;
  
  // 基本清理
  sanitized = sanitized.trim();
  
  // 应用规则
  for (const rule of rules) {
    switch (rule.type) {
      case 'length':
        if (sanitized.length < rule.min || sanitized.length > rule.max) {
          throw new Error(\`输入长度应在\${rule.min}-\${rule.max}个字符之间\`);
        }
        break;
        
      case 'pattern':
        const regex = new RegExp(rule.pattern);
        if (!regex.test(sanitized)) {
          throw new Error(rule.message || '输入格式不正确');
        }
        break;
        
      case 'whitelist':
        const whitelistRegex = new RegExp(\`^[\${rule.chars}]*$\`);
        if (!whitelistRegex.test(sanitized)) {
          throw new Error('输入包含非法字符');
        }
        break;
        
      case 'html':
        // 使用DOMPurify清理HTML
        sanitized = DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: rule.allowedTags || [],
          ALLOWED_ATTR: rule.allowedAttributes || {}
        });
        break;
        
      case 'email':
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!emailRegex.test(sanitized)) {
          throw new Error('请输入有效的邮箱地址');
        }
        break;
        
      case 'url':
        try {
          new URL(sanitized);
        } catch (error) {
          throw new Error('请输入有效的URL');
        }
        break;
    }
  }
  
  return sanitized;
}

// 使用示例
try {
  const cleanInput = validateAndSanitizeInput(userInput, [
    { type: 'length', min: 5, max: 100 },
    { type: 'whitelist', chars: 'a-zA-Z0-9 .,!?' },
    { type: 'html', allowedTags: ['p', 'br', 'strong', 'em'] }
  ]);
  
  // 使用清理后的输入
  processUserInput(cleanInput);
} catch (error) {
  console.error('输入验证失败:', error.message);
  // 显示错误信息给用户
}
\`\`\`

### 2. 安全的API设计

\`\`\`javascript
// 安全的API客户端
class SecureApiClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      timeout: 10000,
      retries: 3,
      csrfToken: null,
      ...options
    };
    
    this.init();
  }
  
  init() {
    // 获取CSRF令牌
    this.fetchCSRFToken();
  }
  
  async fetchCSRFToken() {
    try {
      const response = await fetch(\`\${this.baseUrl}/api/csrf-token\`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.options.csrfToken = data.token;
      }
    } catch (error) {
      console.error('获取CSRF令牌失败:', error);
    }
  }
  
  async request(endpoint, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      ...options
    };
    
    // 添加CSRF令牌
    if (this.options.csrfToken) {
      requestOptions.headers['X-CSRF-Token'] = this.options.csrfToken;
    }
    
    // 添加请求ID用于追踪
    const requestId = generateRequestId();
    requestOptions.headers['X-Request-ID'] = requestId;
    
    try {
      const response = await fetch(url, requestOptions);
      
      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || \`请求失败: \${response.status}\`);
      }
      
      // 验证响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('无效的响应内容类型');
      }
      
      return await response.json();
    } catch (error) {
      console.error(\`API请求失败 [\${requestId}]:\`, error);
      throw error;
    }
  }
  
  // 安全的GET请求
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? \`\${endpoint}?\${queryString}\` : endpoint;
    
    return this.request(url, {
      method: 'GET'
    });
  }
  
  // 安全的POST请求
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // 安全的PUT请求
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  // 安全的DELETE请求
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
}

// 生成请求ID
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 使用示例
const apiClient = new SecureApiClient('https://api.example.com');

// 获取用户数据
apiClient.get('/users', { page: 1, limit: 10 })
  .then(data => console.log('用户数据:', data))
  .catch(error => console.error('获取用户数据失败:', error));

// 创建用户
apiClient.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
  .then(data => console.log('用户创建成功:', data))
  .catch(error => console.error('创建用户失败:', error));
\`\`\`

### 3. 安全的本地存储

\`\`\`javascript
// 安全的本地存储类
class SecureStorage {
  constructor(prefix = 'app_', encryptionKey = null) {
    this.prefix = prefix;
    this.encryptionKey = encryptionKey;
  }
  
  // 生成存储键名
  _generateKey(key) {
    return \`\${this.prefix}\${key}\`;
  }
  
  // 加密数据
  _encrypt(data) {
    if (!this.encryptionKey) {
      return data;
    }
    
    // 这里使用简单的加密示例，实际应用中应使用更安全的加密算法
    return btoa(JSON.stringify(data));
  }
  
  // 解密数据
  _decrypt(encryptedData) {
    if (!this.encryptionKey) {
      return encryptedData;
    }
    
    try {
      return JSON.parse(atob(encryptedData));
    } catch (error) {
      console.error('解密失败:', error);
      return null;
    }
  }
  
  // 设置数据
  set(key, value, options = {}) {
    const storageKey = this._generateKey(key);
    const data = {
      value,
      timestamp: Date.now(),
      expires: options.expires ? Date.now() + options.expires : null
    };
    
    const encryptedData = this._encrypt(data);
    
    try {
      localStorage.setItem(storageKey, encryptedData);
      return true;
    } catch (error) {
      console.error('存储数据失败:', error);
      return false;
    }
  }
  
  // 获取数据
  get(key) {
    const storageKey = this._generateKey(key);
    
    try {
      const encryptedData = localStorage.getItem(storageKey);
      if (!encryptedData) {
        return null;
      }
      
      const data = this._decrypt(encryptedData);
      if (!data) {
        return null;
      }
      
      // 检查是否过期
      if (data.expires && Date.now() > data.expires) {
        this.remove(key);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('获取数据失败:', error);
      return null;
    }
  }
  
  // 移除数据
  remove(key) {
    const storageKey = this._generateKey(key);
    
    try {
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('移除数据失败:', error);
      return false;
    }
  }
  
  // 清空所有数据
  clear() {
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      
      return true;
    } catch (error) {
      console.error('清空数据失败:', error);
      return false;
    }
  }
}

// 使用示例
const secureStorage = new SecureStorage('myapp_', 'encryption-key');

// 存储敏感数据
secureStorage.set('userToken', 'abc123', { expires: 24 * 60 * 60 * 1000 }); // 24小时后过期

// 获取数据
const token = secureStorage.get('userToken');
if (token) {
  console.log('用户令牌:', token);
} else {
  console.log('令牌不存在或已过期');
}
\`\`\`

## 总结

通过这三篇文章，我们全面了解了前端安全基础和XSS防护的知识。以下是XSS防护的多层策略总结：

### 1. 输入验证与过滤
- 对所有用户输入进行严格验证和过滤
- 使用白名单而非黑名单验证方式
- 限制输入长度和允许的字符集
- 对HTML内容进行适当清理

### 2. 输出编码
- 根据上下文对输出内容进行适当编码（HTML、JavaScript、URL、CSS）
- 使用textContent代替innerHTML
- 使用安全的DOM操作方法

### 3. 内容安全策略(CSP)
- 配置适当的CSP头部，限制资源加载来源
- 使用CSP报告模式监控违规行为
- 避免使用unsafe-inline和unsafe-eval

### 4. 安全的API设计
- 使用CSRF令牌防止跨站请求伪造
- 验证请求来源和内容类型
- 实施适当的速率限制和访问控制

### 5. 安全的本地存储
- 避免在localStorage中存储敏感信息
- 对存储的数据进行加密和过期处理
- 使用安全的存储实现

### 6. 定期安全审计
- 使用自动化工具扫描潜在漏洞
- 定期进行代码审查和安全测试
- 保持依赖库的更新和安全补丁

XSS防护是一个多层次、持续的过程，需要在开发的各个阶段都考虑安全性。通过实施这些策略和最佳实践，可以大大提高应用的安全性，有效防范XSS攻击和其他前端安全威胁。

记住，安全不是一次性的任务，而是一个持续的过程。随着攻击技术的不断发展，我们需要不断学习和更新安全知识，以确保应用的安全性。`;export{n as default};
//# sourceMappingURL=22-3-B1uvnXNG.js.map
