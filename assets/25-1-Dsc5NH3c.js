const n=`---
title: "前端数据加密与传输安全（一）- 数据加密基础与哈希算法"
excerpt: "深入探讨前端数据加密的基础知识，包括对称加密和非对称加密的实现，以及哈希算法与数字签名在前端安全中的应用，帮助开发者构建安全的前端应用"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-11-11"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/preview/cover.jpg"
---

## 前言

在当今的Web应用中，数据安全已成为不可忽视的重要环节。前端作为用户与系统交互的第一道防线，承担着保护用户数据安全的重要责任。本文将深入探讨前端数据加密的基础知识，包括对称加密和非对称加密的实现，以及哈希算法与数字签名在前端安全中的应用。

## 数据加密基础

### 加密概念与分类

加密是将明文数据转换为密文的过程，以防止未经授权的访问。根据密钥的使用方式，加密算法主要分为两类：

1. **对称加密**：使用相同的密钥进行加密和解密
2. **非对称加密**：使用一对密钥（公钥和私钥）进行加密和解密

\`\`\`javascript
// 加密基础类
class EncryptionBasics {
  // 生成随机字符串
  static generateRandomString(length = 32) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return result;
  }
  
  // 生成随机字节数组
  static generateRandomBytes(length = 16) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  }
  
  // 字节数组转换为十六进制字符串
  static arrayBufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    let hexString = '';
    
    for (let i = 0; i < byteArray.byteLength; i++) {
      hexString += byteArray[i].toString(16).padStart(2, '0');
    }
    
    return hexString;
  }
  
  // 十六进制字符串转换为字节数组
  static hexToArrayBuffer(hex) {
    const length = hex.length / 2;
    const byteArray = new Uint8Array(length);
    
    for (let i = 0; i < length; i++) {
      byteArray[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    
    return byteArray.buffer;
  }
  
  // Base64编码
  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }
  
  // Base64解码
  static base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    return bytes.buffer;
  }
}
\`\`\`

### 对称加密示例

对称加密使用相同的密钥进行加密和解密，适合大量数据的加密。常用的对称加密算法包括AES、DES和3DES等。

\`\`\`javascript
// 对称加密类
class SymmetricEncryption {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }
  
  // 生成密钥
  async generateKey() {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  // 导入密钥
  async importKey(keyData) {
    return await crypto.subtle.importKey(
      'raw',
      EncryptionBasics.base64ToArrayBuffer(keyData),
      {
        name: this.algorithm
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  // 导出密钥
  async exportKey(key) {
    const exported = await crypto.subtle.exportKey('raw', key);
    return EncryptionBasics.arrayBufferToBase64(exported);
  }
  
  // 加密数据
  async encrypt(data, key) {
    // 生成初始化向量(IV)
    const iv = EncryptionBasics.generateRandomBytes(12);
    
    // 将数据转换为ArrayBuffer
    let dataBuffer;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      dataBuffer = encoder.encode(data);
    } else {
      dataBuffer = data;
    }
    
    // 加密
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      key,
      dataBuffer
    );
    
    // 返回加密结果和IV
    return {
      data: EncryptionBasics.arrayBufferToBase64(encrypted),
      iv: EncryptionBasics.arrayBufferToHex(iv)
    };
  }
  
  // 解密数据
  async decrypt(encryptedData, key) {
    // 提取加密数据和IV
    const data = EncryptionBasics.base64ToArrayBuffer(encryptedData.data);
    const iv = EncryptionBasics.hexToArrayBuffer(encryptedData.iv);
    
    // 解密
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      key,
      data
    );
    
    // 将解密结果转换为字符串
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
  
  // 使用示例
  async example() {
    // 生成密钥
    const key = await this.generateKey();
    
    // 导出密钥
    const exportedKey = await this.exportKey(key);
    console.log('Exported key:', exportedKey);
    
    // 加密数据
    const plaintext = 'This is a secret message';
    const encrypted = await this.encrypt(plaintext, key);
    console.log('Encrypted:', encrypted);
    
    // 解密数据
    const decrypted = await this.decrypt(encrypted, key);
    console.log('Decrypted:', decrypted);
    
    // 验证
    console.log('Match:', plaintext === decrypted);
  }
}
\`\`\`

### 非对称加密示例

非对称加密使用一对密钥（公钥和私钥）进行加密和解密，适合密钥交换和数字签名等场景。常用的非对称加密算法包括RSA和ECC等。

\`\`\`javascript
// 非对称加密类
class AsymmetricEncryption {
  constructor() {
    this.algorithm = 'RSA-OAEP';
    this.hashAlgorithm = 'SHA-256';
    this.modulusLength = 2048;
    this.publicExponent = new Uint8Array([1, 0, 1]);
  }
  
  // 生成密钥对
  async generateKeyPair() {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        modulusLength: this.modulusLength,
        publicExponent: this.publicExponent,
        hash: { name: this.hashAlgorithm }
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  // 导入公钥
  async importPublicKey(keyData) {
    return await crypto.subtle.importKey(
      'spki',
      EncryptionBasics.base64ToArrayBuffer(keyData),
      {
        name: this.algorithm,
        hash: { name: this.hashAlgorithm }
      },
      true,
      ['encrypt']
    );
  }
  
  // 导入私钥
  async importPrivateKey(keyData) {
    return await crypto.subtle.importKey(
      'pkcs8',
      EncryptionBasics.base64ToArrayBuffer(keyData),
      {
        name: this.algorithm,
        hash: { name: this.hashAlgorithm }
      },
      true,
      ['decrypt']
    );
  }
  
  // 导出公钥
  async exportPublicKey(publicKey) {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return EncryptionBasics.arrayBufferToBase64(exported);
  }
  
  // 导出私钥
  async exportPrivateKey(privateKey) {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return EncryptionBasics.arrayBufferToBase64(exported);
  }
  
  // 使用公钥加密
  async encrypt(data, publicKey) {
    // 将数据转换为ArrayBuffer
    let dataBuffer;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      dataBuffer = encoder.encode(data);
    } else {
      dataBuffer = data;
    }
    
    // 加密
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm
      },
      publicKey,
      dataBuffer
    );
    
    // 返回加密结果
    return EncryptionBasics.arrayBufferToBase64(encrypted);
  }
  
  // 使用私钥解密
  async decrypt(encryptedData, privateKey) {
    // 将加密数据转换为ArrayBuffer
    const data = EncryptionBasics.base64ToArrayBuffer(encryptedData);
    
    // 解密
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.algorithm
      },
      privateKey,
      data
    );
    
    // 将解密结果转换为字符串
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
  
  // 使用示例
  async example() {
    // 生成密钥对
    const keyPair = await this.generateKeyPair();
    
    // 导出公钥和私钥
    const exportedPublicKey = await this.exportPublicKey(keyPair.publicKey);
    const exportedPrivateKey = await this.exportPrivateKey(keyPair.privateKey);
    console.log('Exported public key:', exportedPublicKey);
    console.log('Exported private key:', exportedPrivateKey);
    
    // 使用公钥加密
    const plaintext = 'This is a secret message';
    const encrypted = await this.encrypt(plaintext, keyPair.publicKey);
    console.log('Encrypted:', encrypted);
    
    // 使用私钥解密
    const decrypted = await this.decrypt(encrypted, keyPair.privateKey);
    console.log('Decrypted:', decrypted);
    
    // 验证
    console.log('Match:', plaintext === decrypted);
  }
}
\`\`\`

## 哈希算法与数字签名

### 哈希函数实现

哈希函数将任意长度的数据映射为固定长度的哈希值，常用于数据完整性验证和密码存储。

\`\`\`javascript
// 哈希算法类
class HashAlgorithms {
  // 计算哈希值
  static async hash(data, algorithm = 'SHA-256') {
    // 将数据转换为ArrayBuffer
    let dataBuffer;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      dataBuffer = encoder.encode(data);
    } else {
      dataBuffer = data;
    }
    
    // 计算哈希值
    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
    
    // 转换为十六进制字符串
    return EncryptionBasics.arrayBufferToHex(hashBuffer);
  }
  
  // 计算文件哈希值
  static async hashFile(file, algorithm = 'SHA-256') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const hash = await this.hash(event.target.result, algorithm);
          resolve(hash);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  // 比较哈希值
  static compareHashes(hash1, hash2) {
    if (hash1.length !== hash2.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < hash1.length; i++) {
      result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
    }
    
    return result === 0;
  }
  
  // 使用示例
  static async example() {
    // 计算字符串哈希值
    const data = 'This is a test message';
    const sha256Hash = await this.hash(data, 'SHA-256');
    const sha512Hash = await this.hash(data, 'SHA-512');
    
    console.log('SHA-256:', sha256Hash);
    console.log('SHA-512:', sha512Hash);
    
    // 计算文件哈希值
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        const fileHash = await this.hashFile(file);
        console.log('File hash:', fileHash);
      }
    });
    
    // 比较哈希值
    const hash1 = await this.hash('message1');
    const hash2 = await this.hash('message2');
    const hash3 = await this.hash('message1');
    
    console.log('hash1 === hash2:', this.compareHashes(hash1, hash2));
    console.log('hash1 === hash3:', this.compareHashes(hash1, hash3));
  }
}
\`\`\`

### 密码哈希与盐值

为了增强密码安全性，通常使用盐值（salt）与密码结合后再进行哈希计算，以防止彩虹表攻击。

\`\`\`javascript
// 密码哈希类
class PasswordHashing {
  // 生成盐值
  static generateSalt(length = 16) {
    return EncryptionBasics.arrayBufferToHex(
      EncryptionBasics.generateRandomBytes(length)
    );
  }
  
  // 哈希密码
  static async hashPassword(password, salt, iterations = 10000, algorithm = 'SHA-256') {
    // 将密码和盐值转换为ArrayBuffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = EncryptionBasics.hexToArrayBuffer(salt);
    
    // 导入密码作为密钥
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // 派生密钥
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations,
        hash: algorithm
      },
      key,
      256 // 派生256位密钥
    );
    
    // 转换为十六进制字符串
    return EncryptionBasics.arrayBufferToHex(derivedBits);
  }
  
  // 验证密码
  static async verifyPassword(password, salt, hash, iterations = 10000, algorithm = 'SHA-256') {
    // 计算密码哈希值
    const computedHash = await this.hashPassword(password, salt, iterations, algorithm);
    
    // 比较哈希值
    return this.compareHashes(computedHash, hash);
  }
  
  // 比较哈希值（防止时序攻击）
  static compareHashes(hash1, hash2) {
    if (hash1.length !== hash2.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < hash1.length; i++) {
      result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
    }
    
    return result === 0;
  }
  
  // ArrayBuffer转Base64
  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }
  
  // 使用示例
  static async example() {
    // 生成盐值
    const salt = this.generateSalt();
    console.log('Salt:', salt);
    
    // 哈希密码
    const password = 'user_password_123';
    const hash = await this.hashPassword(password, salt);
    console.log('Password hash:', hash);
    
    // 验证密码
    const isValid = await this.verifyPassword(password, salt, hash);
    console.log('Password is valid:', isValid);
    
    // 验证错误密码
    const isInvalid = await this.verifyPassword('wrong_password', salt, hash);
    console.log('Wrong password is valid:', isInvalid);
  }
}
\`\`\`

### 数字签名实现

数字签名用于验证数据的完整性和来源的真实性，通常结合哈希函数和非对称加密实现。

\`\`\`javascript
// 数字签名类
class DigitalSignature {
  constructor() {
    this.algorithm = 'RSA-PSS';
    this.hashAlgorithm = 'SHA-256';
    this.modulusLength = 2048;
    this.publicExponent = new Uint8Array([1, 0, 1]);
  }
  
  // 生成密钥对
  async generateKeyPair() {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        modulusLength: this.modulusLength,
        publicExponent: this.publicExponent,
        hash: { name: this.hashAlgorithm }
      },
      true,
      ['sign', 'verify']
    );
  }
  
  // 导入公钥
  async importPublicKey(keyData) {
    return await crypto.subtle.importKey(
      'spki',
      EncryptionBasics.base64ToArrayBuffer(keyData),
      {
        name: this.algorithm,
        hash: { name: this.hashAlgorithm }
      },
      true,
      ['verify']
    );
  }
  
  // 导入私钥
  async importPrivateKey(keyData) {
    return await crypto.subtle.importKey(
      'pkcs8',
      EncryptionBasics.base64ToArrayBuffer(keyData),
      {
        name: this.algorithm,
        hash: { name: this.hashAlgorithm }
      },
      true,
      ['sign']
    );
  }
  
  // 导出公钥
  async exportPublicKey(publicKey) {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return EncryptionBasics.arrayBufferToBase64(exported);
  }
  
  // 导出私钥
  async exportPrivateKey(privateKey) {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return EncryptionBasics.arrayBufferToBase64(exported);
  }
  
  // 签名数据
  async sign(data, privateKey) {
    // 将数据转换为ArrayBuffer
    let dataBuffer;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      dataBuffer = encoder.encode(data);
    } else {
      dataBuffer = data;
    }
    
    // 签名
    const signature = await crypto.subtle.sign(
      {
        name: this.algorithm,
        saltLength: 32
      },
      privateKey,
      dataBuffer
    );
    
    // 返回签名
    return EncryptionBasics.arrayBufferToBase64(signature);
  }
  
  // 验证签名
  async verify(data, signature, publicKey) {
    // 将数据和签名转换为ArrayBuffer
    let dataBuffer;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      dataBuffer = encoder.encode(data);
    } else {
      dataBuffer = data;
    }
    
    const signatureBuffer = EncryptionBasics.base64ToArrayBuffer(signature);
    
    // 验证签名
    return await crypto.subtle.verify(
      {
        name: this.algorithm,
        saltLength: 32
      },
      publicKey,
      signatureBuffer,
      dataBuffer
    );
  }
  
  // 使用示例
  async example() {
    // 生成密钥对
    const keyPair = await this.generateKeyPair();
    
    // 导出公钥和私钥
    const exportedPublicKey = await this.exportPublicKey(keyPair.publicKey);
    const exportedPrivateKey = await this.exportPrivateKey(keyPair.privateKey);
    console.log('Exported public key:', exportedPublicKey);
    console.log('Exported private key:', exportedPrivateKey);
    
    // 签名数据
    const data = 'This is a message to be signed';
    const signature = await this.sign(data, keyPair.privateKey);
    console.log('Signature:', signature);
    
    // 验证签名
    const isValid = await this.verify(data, signature, keyPair.publicKey);
    console.log('Signature is valid:', isValid);
    
    // 验证篡改后的数据
    const tamperedData = 'This is a tampered message';
    const isTamperedValid = await this.verify(tamperedData, signature, keyPair.publicKey);
    console.log('Tampered signature is valid:', isTamperedValid);
  }
}
\`\`\`

### 消息认证码

消息认证码（MAC）用于验证消息的完整性和真实性，使用共享密钥生成和验证。

\`\`\`javascript
// 消息认证码类
class MessageAuthenticationCode {
  constructor() {
    this.algorithm = 'HMAC';
    this.hashAlgorithm = 'SHA-256';
  }
  
  // 生成密钥
  async generateKey() {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        hash: { name: this.hashAlgorithm },
        length: 256
      },
      true,
      ['sign', 'verify']
    );
  }
  
  // 导入密钥
  async importKey(keyData) {
    return await crypto.subtle.importKey(
      'raw',
      EncryptionBasics.base64ToArrayBuffer(keyData),
      {
        name: this.algorithm,
        hash: { name: this.hashAlgorithm }
      },
      true,
      ['sign', 'verify']
    );
  }
  
  // 导出密钥
  async exportKey(key) {
    const exported = await crypto.subtle.exportKey('raw', key);
    return EncryptionBasics.arrayBufferToBase64(exported);
  }
  
  // 生成MAC
  async generateMac(data, key) {
    // 将数据转换为ArrayBuffer
    let dataBuffer;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      dataBuffer = encoder.encode(data);
    } else {
      dataBuffer = data;
    }
    
    // 生成MAC
    const mac = await crypto.subtle.sign(
      this.algorithm,
      key,
      dataBuffer
    );
    
    // 返回MAC
    return EncryptionBasics.arrayBufferToBase64(mac);
  }
  
  // 验证MAC
  async verifyMac(data, mac, key) {
    // 将数据转换为ArrayBuffer
    let dataBuffer;
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      dataBuffer = encoder.encode(data);
    } else {
      dataBuffer = data;
    }
    
    // 将MAC转换为ArrayBuffer
    const macBuffer = EncryptionBasics.base64ToArrayBuffer(mac);
    
    // 验证MAC
    return await crypto.subtle.verify(
      this.algorithm,
      key,
      macBuffer,
      dataBuffer
    );
  }
  
  // 使用示例
  async example() {
    // 生成密钥
    const key = await this.generateKey();
    
    // 生成MAC
    const data = "This is a secret message";
    const mac = await this.generateMac(data, key);
    console.log('MAC:', mac);
    
    // 验证MAC
    const isValid = await this.verifyMac(data, mac, key);
    console.log('MAC is valid:', isValid);
    
    // 验证篡改后的数据
    const tamperedData = "This is a tampered message";
    const isTamperedValid = await this.verifyMac(tamperedData, mac, key);
    console.log('Tampered MAC is valid:', isTamperedValid);
  }
}
\`\`\`

## 总结

本文介绍了前端数据加密的基础知识，包括对称加密和非对称加密的实现，以及哈希算法与数字签名在前端安全中的应用。通过使用Web Crypto API，我们可以在前端实现强大的加密功能，保护用户数据的安全。

在下一篇文章中，我们将继续探讨HTTPS传输安全、安全存储技术以及实际应用案例，帮助您构建更安全的前端应用。`;export{n as default};
//# sourceMappingURL=25-1-Dsc5NH3c.js.map
