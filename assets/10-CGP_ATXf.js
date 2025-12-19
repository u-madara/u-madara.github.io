const n=`---
title: "JavaScript原型链与继承机制"
excerpt: "深入探讨JavaScript原型链与继承机制的工作原理，从原型对象、原型链到各种继承模式，全面解析JavaScript面向对象编程的核心概念，帮助开发者真正理解并灵活运用JavaScript的继承特性"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-09-15"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
---

# JavaScript原型链与继承机制

## 引言

JavaScript的继承机制基于原型链（Prototype Chain），这与基于类的继承系统有着本质区别。理解原型链和继承机制是掌握JavaScript面向对象编程的关键。本文将从基础概念到高级应用，全面解析JavaScript原型链与继承机制的方方面面，帮助开发者真正理解这一核心概念。

## 1. 原型与原型对象

### 1.1 原型对象的基本概念

每个JavaScript对象都有一个内部属性\`[[Prototype]]\`（通常通过\`__proto__\`访问），它指向另一个对象，这个对象就是原型对象。

\`\`\`javascript
// 原型对象基本示例
function Person(name, age) {
  this.name = name;
  this.age = age;
}

// 在Person的原型上添加方法
Person.prototype.sayHello = function() {
  console.log(\`Hello, my name is \${this.name}\`);
};

// 创建Person实例
var person1 = new Person('Alice', 25);
var person2 = new Person('Bob', 30);

// 实例共享原型上的方法
person1.sayHello(); // "Hello, my name is Alice"
person2.sayHello(); // "Hello, my name is Bob"

// 检查原型关系
console.log(person1.__proto__ === Person.prototype); // true
console.log(person2.__proto__ === Person.prototype); // true
console.log(Person.prototype.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__ === null); // true

// 属性查找过程
function propertyLookup() {
  function Person(name) {
    this.name = name;
  }
  
  Person.prototype.age = 25;
  
  var person = new Person('Alice');
  
  // 访问name属性：在实例上找到
  console.log(person.name); // 'Alice'
  
  // 访问age属性：在原型上找到
  console.log(person.age); // 25
  
  // 访问toString方法：在Object.prototype上找到
  console.log(person.toString()); // "[object Object]"
  
  // 访问不存在的属性：返回undefined
  console.log(person.nonExistent); // undefined
}
\`\`\`

### 1.2 原型链的工作原理

原型链是由一系列相互链接的原型对象组成的链式结构，用于实现属性和方法的继承。

\`\`\`javascript
// 原型链示例
function prototypeChain() {
  function Animal(name) {
    this.name = name;
  }
  
  Animal.prototype.eat = function() {
    console.log(\`\${this.name} is eating\`);
  };
  
  function Dog(name, breed) {
    Animal.call(this, name); // 调用父类构造函数
    this.breed = breed;
  }
  
  // 设置Dog的原型为Animal的实例
  Dog.prototype = Object.create(Animal.prototype);
  Dog.prototype.constructor = Dog; // 修复constructor指向
  
  Dog.prototype.bark = function() {
    console.log(\`\${this.name} is barking\`);
  };
  
  var dog = new Dog('Rex', 'German Shepherd');
  
  // 方法调用沿着原型链进行
  dog.eat(); // 来自Animal.prototype
  dog.bark(); // 来自Dog.prototype
  
  // 检查原型链
  console.log(dog.__proto__ === Dog.prototype); // true
  console.log(dog.__proto__.__proto__ === Animal.prototype); // true
  console.log(dog.__proto__.__proto__.__proto__ === Object.prototype); // true
  
  // 使用instanceof检查原型链
  console.log(dog instanceof Dog); // true
  console.log(dog instanceof Animal); // true
  console.log(dog instanceof Object); // true
}

// 原型链的动态性
function dynamicPrototypeChain() {
  function Person(name) {
    this.name = name;
  }
  
  var person1 = new Person('Alice');
  var person2 = new Person('Bob');
  
  // 在创建实例后修改原型
  Person.prototype.sayHello = function() {
    console.log(\`Hello, my name is \${this.name}\`);
  };
  
  // 所有实例都能访问新添加的方法
  person1.sayHello(); // "Hello, my name is Alice"
  person2.sayHello(); // "Hello, my name is Bob"
  
  // 修改原型上的方法
  Person.prototype.sayHello = function() {
    console.log(\`Hi, I'm \${this.name}\`);
  };
  
  // 所有实例都使用新方法
  person1.sayHello(); // "Hi, I'm Alice"
  person2.sayHello(); // "Hi, I'm Bob"
  
  // 在实例上添加同名属性会遮蔽原型属性
  person1.sayHello = function() {
    console.log(\`I am \${this.name}, special greeting\`);
  };
  
  person1.sayHello(); // "I am Alice, special greeting"（实例方法）
  person2.sayHello(); // "Hi, I'm Bob"（原型方法）
  
  // 删除实例属性后可以重新访问原型属性
  delete person1.sayHello;
  person1.sayHello(); // "Hi, I'm Alice"（重新使用原型方法）
}
\`\`\`

## 2. 属性访问与查找机制

### 2.1 属性查找过程

当访问一个对象的属性时，JavaScript引擎会按照特定的顺序在原型链中查找。

\`\`\`javascript
// 属性查找过程详解
function propertyLookupProcess() {
  function Parent() {
    this.parentProperty = 'parent';
  }
  
  Parent.prototype.parentProtoProperty = 'parent proto';
  
  function Child() {
    this.childProperty = 'child';
  }
  
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
  Child.prototype.childProtoProperty = 'child proto';
  
  var child = new Child();
  
  // 属性查找顺序：
  // 1. 在实例对象上查找
  // 2. 在Child.prototype上查找
  // 3. 在Parent.prototype上查找
  // 4. 在Object.prototype上查找
  // 5. 返回undefined
  
  console.log(child.childProperty); // 在实例上找到
  console.log(child.childProtoProperty); // 在Child.prototype上找到
  console.log(child.parentProperty); // 在Parent实例上找到（通过Child实例）
  console.log(child.parentProtoProperty); // 在Parent.prototype上找到
  console.log(child.toString()); // 在Object.prototype上找到
  console.log(child.nonExistent); // 未找到，返回undefined
  
  // 使用hasOwnProperty检查属性是否在实例上
  console.log(child.hasOwnProperty('childProperty')); // true
  console.log(child.hasOwnProperty('childProtoProperty')); // false
  console.log(child.hasOwnProperty('parentProperty')); // false
  console.log(child.hasOwnProperty('parentProtoProperty')); // false
  
  // 使用in操作符检查属性是否在实例或原型链上
  console.log('childProperty' in child); // true
  console.log('childProtoProperty' in child); // true
  console.log('parentProperty' in child); // true
  console.log('parentProtoProperty' in child); // true
  console.log('nonExistent' in child); // false
}

// 属性描述符与原型链
function propertyDescriptorsAndPrototype() {
  function Person(name) {
    this.name = name;
  }
  
  Object.defineProperty(Person.prototype, 'age', {
    value: 25,
    writable: true,
    enumerable: true,
    configurable: true
  });
  
  Object.defineProperty(Person.prototype, 'secret', {
    value: 'This is a secret',
    enumerable: false // 不可枚举
  });
  
  var person = new Person('Alice');
  
  // 获取属性描述符
  console.log(Object.getOwnPropertyDescriptor(person, 'name'));
  console.log(Object.getOwnPropertyDescriptor(Person.prototype, 'age'));
  console.log(Object.getOwnPropertyDescriptor(Person.prototype, 'secret'));
  
  // 枚举属性
  console.log(Object.keys(person)); // ['name']，不包含原型上的属性
  
  // 获取所有可枚举属性（包括原型链）
  for (var key in person) {
    console.log(key); // name, age
  }
  
  // 获取所有属性（包括不可枚举）
  console.log(Object.getOwnPropertyNames(person)); // ['name']
  console.log(Object.getOwnPropertyNames(Person.prototype)); // ['constructor', 'age', 'secret']
}
\`\`\`

### 2.2 属性设置与遮蔽

设置对象属性时，如果属性已存在于原型链中，可能会创建新的实例属性而不是修改原型属性。

\`\`\`javascript
// 属性设置与遮蔽
function propertyAssignmentAndShadowing() {
  function Person() {}
  
  Person.prototype.name = 'Default Name';
  
  var person1 = new Person();
  var person2 = new Person();
  
  // 读取原型属性
  console.log(person1.name); // 'Default Name'
  console.log(person2.name); // 'Default Name'
  
  // 设置属性：创建实例属性，遮蔽原型属性
  person1.name = 'Alice';
  
  console.log(person1.name); // 'Alice'（实例属性）
  console.log(person2.name); // 'Default Name'（原型属性）
  
  // 检查属性位置
  console.log(person1.hasOwnProperty('name')); // true
  console.log(person2.hasOwnProperty('name')); // false
  
  // 直接修改原型属性
  Person.prototype.name = 'Bob';
  
  console.log(person1.name); // 'Alice'（实例属性，不受影响）
  console.log(person2.name); // 'Bob'（原型属性已修改）
  
  // 删除实例属性后重新访问原型属性
  delete person1.name;
  console.log(person1.name); // 'Bob'（原型属性）
}

// 只读属性与遮蔽
function readOnlyPropertiesAndShadowing() {
  function Person() {}
  
  Object.defineProperty(Person.prototype, 'name', {
    value: 'Default Name',
    writable: false // 只读
  });
  
  var person = new Person();
  
  // 尝试修改只读属性
  person.name = 'Alice'; // 非严格模式下静默失败，严格模式下抛出TypeError
  
  console.log(person.name); // 'Default Name'（未被修改）
  console.log(person.hasOwnProperty('name')); // false（未创建实例属性）
  
  // 在严格模式下
  'use strict';
  try {
    person.name = 'Alice'; // TypeError: Cannot assign to read only property 'name'
  } catch (e) {
    console.error(e.message);
  }
}
\`\`\`

## 3. JavaScript中的继承模式

### 3.1 原型链继承

原型链继承是最基本的继承方式，通过将子类的原型设置为父类的实例来实现。

\`\`\`javascript
// 基本原型链继承
function prototypeChainInheritance() {
  function Parent(name) {
    this.name = name;
    this.colors = ['red', 'green', 'blue'];
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    this.age = age;
  }
  
  // 继承：将Child的原型设置为Parent的实例
  Child.prototype = new Parent();
  
  // 添加子类方法
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  var child1 = new Child('Alice', 25);
  var child2 = new Child('Bob', 30);
  
  child1.sayName(); // 'Alice'
  child1.sayAge();  // 25
  
  // 问题1：引用类型属性被所有实例共享
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue', 'yellow']（被影响）
  
  // 问题2：无法向父类构造函数传递参数
  // Child.prototype = new Parent(); // 无法传递name参数
}

// 改进的原型链继承
function improvedPrototypeChainInheritance() {
  function Parent(name) {
    this.name = name;
    this.colors = ['red', 'green', 'blue'];
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    Parent.call(this, name); // 调用父类构造函数，传递参数
    this.age = age;
  }
  
  // 使用Object.create创建更纯净的原型链
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child; // 修复constructor指向
  
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  var child1 = new Child('Alice', 25);
  var child2 = new Child('Bob', 30);
  
  child1.sayName(); // 'Alice'
  child1.sayAge();  // 25
  
  // 引用类型属性不再共享
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue']（不受影响）
}
\`\`\`

### 3.2 构造函数继承

构造函数继承通过在子类构造函数中调用父类构造函数来实现继承。

\`\`\`javascript
// 基本构造函数继承
function constructorInheritance() {
  function Parent(name) {
    this.name = name;
    this.colors = ['red', 'green', 'blue'];
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    // 继承：调用父类构造函数
    Parent.call(this, name);
    this.age = age;
  }
  
  var child1 = new Child('Alice', 25);
  var child2 = new Child('Bob', 30);
  
  // 实例属性被正确继承
  console.log(child1.name); // 'Alice'
  console.log(child1.colors); // ['red', 'green', 'blue']
  
  // 引用类型属性不共享
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue']（不受影响）
  
  // 问题：无法继承原型方法
  // child1.sayName(); // TypeError: child1.sayName is not a function
}

// 构造函数继承的优缺点
function constructorInheritanceProsCons() {
  // 优点：
  // 1. 可以在子类构造函数中向父类构造函数传递参数
  // 2. 避免了引用类型属性被所有实例共享的问题
  // 3. 每个实例都有自己的一份属性副本
  
  // 缺点：
  // 1. 方法都在构造函数中定义，每次创建实例都会创建一遍方法
  // 2. 无法继承原型上的方法和属性
  // 3. 无法实现函数复用，影响性能
  
  function Parent(name) {
    this.name = name;
    this.sayName = function() {
      console.log(this.name);
    };
  }
  
  function Child(name, age) {
    Parent.call(this, name);
    this.age = age;
  }
  
  var child1 = new Child('Alice', 25);
  var child2 = new Child('Bob', 30);
  
  // 每个实例都有自己的sayName方法
  console.log(child1.sayName === child2.sayName); // false
}
\`\`\`

### 3.3 组合继承

组合继承结合了原型链继承和构造函数继承的优点，是最常用的继承模式。

\`\`\`javascript
// 组合继承
function combinationInheritance() {
  function Parent(name) {
    this.name = name;
    this.colors = ['red', 'green', 'blue'];
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    // 构造函数继承：继承实例属性
    Parent.call(this, name);
    this.age = age;
  }
  
  // 原型链继承：继承原型方法
  Child.prototype = new Parent();
  Child.prototype.constructor = Child;
  
  // 添加子类方法
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  var child1 = new Child('Alice', 25);
  var child2 = new Child('Bob', 30);
  
  // 继承了实例属性
  console.log(child1.name); // 'Alice'
  console.log(child1.colors); // ['red', 'green', 'blue']
  
  // 引用类型属性不共享
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue']（不受影响）
  
  // 继承了原型方法
  child1.sayName(); // 'Alice'
  child1.sayAge();  // 25
  
  // 检查原型链
  console.log(child1 instanceof Child); // true
  console.log(child1 instanceof Parent); // true
  console.log(child1 instanceof Object); // true
}

// 组合继承的问题
function combinationInheritanceIssue() {
  // 问题：父类构造函数被调用了两次
  // 1. 在设置子类原型时：Child.prototype = new Parent()
  // 2. 在创建子类实例时：Parent.call(this, name)
  
  function Parent(name) {
    this.name = name;
    console.log('Parent constructor called');
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    Parent.call(this, name); // 第二次调用
    this.age = age;
  }
  
  Child.prototype = new Parent(); // 第一次调用
  Child.prototype.constructor = Child;
  
  var child = new Child('Alice', 25);
  // 输出：Parent constructor called
  // 输出：Parent constructor called
  
  // 结果：子类原型上有不必要的实例属性
  console.log(Child.prototype.name); // undefined（没有传递参数）
  console.log(child.__proto__.hasOwnProperty('name')); // true
}
\`\`\`

### 3.4 原型式继承

原型式继承是基于已有对象创建新对象的继承方式，不使用构造函数。

\`\`\`javascript
// 基本原型式继承
function prototypalInheritance() {
  // Object.create的简单实现
  function objectCreate(proto) {
    function F() {}
    F.prototype = proto;
    return new F();
  }
  
  var person = {
    name: 'Default Name',
    friends: ['Alice', 'Bob'],
    sayName: function() {
      console.log(this.name);
    }
  };
  
  var person1 = objectCreate(person);
  person1.name = 'Person 1';
  
  var person2 = objectCreate(person);
  person2.name = 'Person 2';
  
  person1.sayName(); // 'Person 1'
  person2.sayName(); // 'Person 2'
  
  // 问题：引用类型属性被共享
  person1.friends.push('Charlie');
  console.log(person1.friends); // ['Alice', 'Bob', 'Charlie']
  console.log(person2.friends); // ['Alice', 'Bob', 'Charlie']（被影响）
}

// 使用Object.create
function usingObjectCreate() {
  var person = {
    name: 'Default Name',
    friends: ['Alice', 'Bob'],
    sayName: function() {
      console.log(this.name);
    }
  };
  
  var person1 = Object.create(person);
  person1.name = 'Person 1';
  
  var person2 = Object.create(person);
  person2.name = 'Person 2';
  
  person1.sayName(); // 'Person 1'
  person2.sayName(); // 'Person 2'
  
  // Object.create的第二个参数可以定义属性
  var person3 = Object.create(person, {
    name: {
      value: 'Person 3',
      enumerable: true,
      writable: true,
      configurable: true
    },
    age: {
      value: 25,
      enumerable: true,
      writable: true,
      configurable: true
    }
  });
  
  console.log(person3.name); // 'Person 3'
  console.log(person3.age);  // 25
  console.log(person3.friends); // ['Alice', 'Bob']
}
\`\`\`

### 3.5 寄生式继承

寄生式继承是原型式继承的增强，通过创建一个封装继承过程的函数来实现。

\`\`\`javascript
// 寄生式继承
function parasiticInheritance() {
  function createAnother(original) {
    var clone = Object.create(original); // 创建新对象
    
    // 增强对象
    clone.sayHi = function() {
      console.log('Hi');
    };
    
    return clone;
  }
  
  var person = {
    name: 'Default Name',
    friends: ['Alice', 'Bob']
  };
  
  var person1 = createAnother(person);
  person1.sayHi(); // 'Hi'
  
  // 问题：方法在每次创建对象时都会重新创建
  var person2 = createAnother(person);
  console.log(person1.sayHi === person2.sayHi); // false
}

// 寄生式继承与组合继承结合
function parasiticCombinationInheritance() {
  function inheritPrototype(child, parent) {
    var prototype = Object.create(parent.prototype); // 创建父类原型的副本
    prototype.constructor = child; // 增强对象
    child.prototype = prototype; // 指定对象
  }
  
  function Parent(name) {
    this.name = name;
    this.colors = ['red', 'green', 'blue'];
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    Parent.call(this, name); // 继承实例属性
    this.age = age;
  }
  
  // 使用寄生式继承继承原型
  inheritPrototype(Child, Parent);
  
  // 添加子类方法
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  var child = new Child('Alice', 25);
  
  child.sayName(); // 'Alice'
  child.sayAge();  // 25
  
  // 优点：只调用了一次父类构造函数
  // 优点：原型链保持不变
  // 优点：可以使用instanceof和isPrototypeOf
  console.log(child instanceof Child); // true
  console.log(child instanceof Parent); // true
}
\`\`\`

## 4. ES6中的类与继承

### 4.1 类的定义与使用

ES6引入了\`class\`关键字，提供了更清晰的面向对象编程语法，但本质上仍然是基于原型的继承。

\`\`\`javascript
// ES6类的基本定义
function es6ClassBasics() {
  class Person {
    // 构造函数
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }
    
    // 实例方法（添加到原型上）
    sayName() {
      console.log(this.name);
    }
    
    sayAge() {
      console.log(this.age);
    }
    
    // 静态方法（添加到构造函数上）
    static createAnonymous() {
      return new Person('Anonymous', 0);
    }
  }
  
  // 创建实例
  const person1 = new Person('Alice', 25);
  const person2 = new Person('Bob', 30);
  
  // 调用实例方法
  person1.sayName(); // 'Alice'
  person1.sayAge();  // 25
  
  // 调用静态方法
  const anonymous = Person.createAnonymous();
  console.log(anonymous.name); // 'Anonymous'
  
  // 检查原型关系
  console.log(person1.__proto__ === Person.prototype); // true
  console.log(Person.prototype.__proto__ === Object.prototype); // true
  
  // 类表达式
  const PersonExpression = class {
    constructor(name) {
      this.name = name;
    }
    
    sayName() {
      console.log(this.name);
    }
  };
  
  const person3 = new PersonExpression('Charlie');
  person3.sayName(); // 'Charlie'
  
  // 命名类表达式
  const PersonNamedExpression = class PersonNamed {
    constructor(name) {
      this.name = name;
    }
    
    sayName() {
      console.log(this.name);
    }
    
    // 类内部可以引用命名
    static getClassName() {
      return PersonNamed.name;
    }
  };
  
  console.log(PersonNamedExpression.getClassName()); // 'PersonNamed'
}

// 类的属性与方法
function classPropertiesAndMethods() {
  class Person {
    // 实例属性（在构造函数中定义）
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }
    
    // 公共方法（添加到原型上）
    sayName() {
      console.log(this.name);
    }
    
    // 私有方法（约定使用下划线前缀）
    _validateAge(age) {
      return age >= 0 && age <= 150;
    }
    
    // 静态属性（ES2022）
    static species = 'Homo sapiens';
    
    // 静态方法
    static createAdult(name) {
      return new Person(name, 18);
    }
    
    // Getter方法
    get info() {
      return \`\${this.name} is \${this.age} years old\`;
    }
    
    // Setter方法
    set age(value) {
      if (this._validateAge(value)) {
        this._age = value;
      } else {
        throw new Error('Invalid age');
      }
    }
    
    get age() {
      return this._age;
    }
  }
  
  const person = new Person('Alice', 25);
  
  // 使用getter和setter
  console.log(person.info); // 'Alice is 25 years old'
  person.age = 30;
  console.log(person.age); // 30
  
  // 访问静态属性
  console.log(Person.species); // 'Homo sapiens'
  
  // 使用静态方法
  const adult = Person.createAdult('Bob');
  console.log(adult.age); // 18
}
\`\`\`

### 4.2 ES6继承

ES6使用\`extends\`关键字实现继承，提供了更简洁的语法。

\`\`\`javascript
// ES6继承基本语法
function es6InheritanceBasics() {
  class Animal {
    constructor(name) {
      this.name = name;
    }
    
    eat() {
      console.log(\`\${this.name} is eating\`);
    }
  }
  
  class Dog extends Animal {
    constructor(name, breed) {
      super(name); // 调用父类构造函数
      this.breed = breed;
    }
    
    bark() {
      console.log(\`\${this.name} is barking\`);
    }
    
    // 重写父类方法
    eat() {
      console.log(\`\${this.name} (\${this.breed}) is eating dog food\`);
      // 调用父类方法
      super.eat();
    }
  }
  
  const dog = new Dog('Rex', 'German Shepherd');
  
  dog.eat(); // 调用重写的方法
  dog.bark(); // 调用子类方法
  
  // 检查原型链
  console.log(dog instanceof Dog); // true
  console.log(dog instanceof Animal); // true
  console.log(dog instanceof Object); // true
  
  // 原型关系
  console.log(Dog.prototype.__proto__ === Animal.prototype); // true
  console.log(Animal.prototype.__proto__ === Object.prototype); // true
}

// 继承内置类型
function inheritingBuiltInTypes() {
  class MyArray extends Array {
    constructor(...args) {
      super(...args);
    }
    
    // 添加自定义方法
    first() {
      return this[0];
    }
    
    last() {
      return this[this.length - 1];
    }
    
    // 重写内置方法
    push(...items) {
      console.log(\`Adding \${items.join(', ')} to the array\`);
      return super.push(...items);
    }
  }
  
  const myArray = new MyArray(1, 2, 3);
  
  console.log(myArray.first()); // 1
  console.log(myArray.last());  // 3
  
  myArray.push(4, 5); // "Adding 4, 5 to the array"
  console.log(myArray); // [1, 2, 3, 4, 5]
  
  // 继承Error类
  class CustomError extends Error {
    constructor(message) {
      super(message);
      this.name = 'CustomError';
    }
  }
  
  try {
    throw new CustomError('This is a custom error');
  } catch (e) {
    console.log(e.name); // 'CustomError'
    console.log(e.message); // 'This is a custom error'
  }
}

// 混入模式（Multiple Inheritance）
function mixinPattern() {
  // 定义混入
  const canEat = {
    eat() {
      console.log(\`\${this.name} is eating\`);
    }
  };
  
  const canWalk = {
    walk() {
      console.log(\`\${this.name} is walking\`);
    }
  };
  
  const canSwim = {
    swim() {
      console.log(\`\${this.name} is swimming\`);
    }
  };
  
  // 使用混入的函数
  function mixins(baseClass, ...mixins) {
    class Mixed extends baseClass {
      constructor(...args) {
        super(...args);
        
        // 复制混入方法到实例
        mixins.forEach(mixin => {
          Object.getOwnPropertyNames(mixin).forEach(name => {
            if (name !== 'constructor') {
              this[name] = mixin[name].bind(this);
            }
          });
        });
      }
    }
    
    // 复制混入方法到原型
    mixins.forEach(mixin => {
      Object.getOwnPropertyNames(mixin).forEach(name => {
        if (name !== 'constructor') {
          Mixed.prototype[name] = mixin[name];
        }
      });
    });
    
    return Mixed;
  }
  
  class Person {
    constructor(name) {
      this.name = name;
    }
  }
  
  // 创建混入类
  const Athlete = mixins(Person, canEat, canWalk);
  const Swimmer = mixins(Person, canEat, canSwim);
  
  const athlete = new Athlete('Alice');
  const swimmer = new Swimmer('Bob');
  
  athlete.eat(); // 'Alice is eating'
  athlete.walk(); // 'Alice is walking'
  
  swimmer.eat(); // 'Bob is eating'
  swimmer.swim(); // 'Bob is swimming'
}
\`\`\`

## 5. 高级继承技巧

### 5.1 多重继承与混入

JavaScript本身不支持多重继承，但可以通过混入（Mixin）模式实现类似效果。

\`\`\`javascript
// 对象混入
function objectMixins() {
  // 定义混入对象
  const canEat = {
    eat(food) {
      console.log(\`\${this.name} is eating \${food}\`);
    }
  };
  
  const canWalk = {
    walk() {
      console.log(\`\${this.name} is walking\`);
    }
  };
  
  const canSwim = {
    swim() {
      console.log(\`\${this.name} is swimming\`);
    }
  };
  
  // 使用Object.assign实现混入
  function Person(name) {
    this.name = name;
  }
  
  Object.assign(Person.prototype, canEat, canWalk);
  
  const person = new Person('Alice');
  person.eat('apple'); // 'Alice is eating apple'
  person.walk(); // 'Alice is walking'
  // person.swim(); // TypeError: person.swim is not a function
  
  // 使用扩展运算符实现混入
  class Animal {
    constructor(name) {
      this.name = name;
    }
  }
  
  class Fish extends Animal {
    constructor(name) {
      super(name);
      Object.assign(this, canSwim);
    }
  }
  
  const fish = new Fish('Nemo');
  fish.swim(); // 'Nemo is swimming'
}

// 函数混入
function functionalMixins() {
  // 定义混入函数
  function canEat(Base) {
    return class extends Base {
      eat(food) {
        console.log(\`\${this.name} is eating \${food}\`);
      }
    };
  }
  
  function canWalk(Base) {
    return class extends Base {
      walk() {
        console.log(\`\${this.name} is walking\`);
      }
    };
  }
  
  function canSwim(Base) {
    return class extends Base {
      swim() {
        console.log(\`\${this.name} is swimming\`);
      }
    };
  }
  
  // 基类
  class Person {
    constructor(name) {
      this.name = name;
    }
  }
  
  // 应用混入
  class Athlete extends canEat(canWalk(Person)) {}
  
  const athlete = new Athlete('Alice');
  athlete.eat('banana'); // 'Alice is eating banana'
  athlete.walk(); // 'Alice is walking'
  
  // 更灵活的混入
  function withMixins(Base, ...mixins) {
    return mixins.reduce((acc, mixin) => mixin(acc), Base);
  }
  
  class Duck extends withMixins(Person, canEat, canWalk, canSwim) {}
  
  const duck = new Duck('Donald');
  duck.eat('bread'); // 'Donald is eating bread'
  duck.walk(); // 'Donald is walking'
  duck.swim(); // 'Donald is swimming'
}
\`\`\`

### 5.2 动态继承与工厂模式

有时我们需要在运行时决定继承关系，这时可以使用动态继承和工厂模式。

\`\`\`javascript
// 动态继承
function dynamicInheritance() {
  class Animal {
    constructor(name) {
      this.name = name;
    }
    
    speak() {
      console.log(\`\${this.name} makes a sound\`);
    }
  }
  
  class Dog extends Animal {
    speak() {
      console.log(\`\${this.name} barks\`);
    }
  }
  
  class Cat extends Animal {
    speak() {
      console.log(\`\${this.name} meows\`);
    }
  }
  
  // 动态创建子类
  function createAnimal(type, name) {
    let AnimalClass;
    
    switch (type) {
      case 'dog':
        AnimalClass = Dog;
        break;
      case 'cat':
        AnimalClass = Cat;
        break;
      default:
        AnimalClass = Animal;
    }
    
    return new AnimalClass(name);
  }
  
  const dog = createAnimal('dog', 'Rex');
  const cat = createAnimal('cat', 'Whiskers');
  const unknown = createAnimal('bird', 'Tweety');
  
  dog.speak(); // 'Rex barks'
  cat.speak(); // 'Whiskers meows'
  unknown.speak(); // 'Tweety makes a sound'
}

// 工厂模式与继承
function factoryPatternAndInheritance() {
  // 抽象工厂
  class AnimalFactory {
    static createAnimal(type, ...args) {
      switch (type) {
        case 'dog':
          return new Dog(...args);
        case 'cat':
          return new Cat(...args);
        case 'bird':
          return new Bird(...args);
        default:
          throw new Error(\`Unknown animal type: \${type}\`);
      }
    }
  }
  
  // 基类
  class Animal {
    constructor(name) {
      this.name = name;
    }
    
    speak() {
      console.log(\`\${this.name} makes a sound\`);
    }
  }
  
  // 子类
  class Dog extends Animal {
    constructor(name, breed) {
      super(name);
      this.breed = breed;
    }
    
    speak() {
      console.log(\`\${this.name} (\${this.breed}) barks\`);
    }
  }
  
  class Cat extends Animal {
    constructor(name, color) {
      super(name);
      this.color = color;
    }
    
    speak() {
      console.log(\`\${this.name} (\${this.color}) meows\`);
    }
  }
  
  class Bird extends Animal {
    constructor(name, canFly = true) {
      super(name);
      this.canFly = canFly;
    }
    
    speak() {
      console.log(\`\${this.name} chirps\`);
    }
    
    fly() {
      if (this.canFly) {
        console.log(\`\${this.name} is flying\`);
      } else {
        console.log(\`\${this.name} cannot fly\`);
      }
    }
  }
  
  // 使用工厂创建实例
  const dog = AnimalFactory.createAnimal('dog', 'Rex', 'German Shepherd');
  const cat = AnimalFactory.createAnimal('cat', 'Whiskers', 'black');
  const bird = AnimalFactory.createAnimal('bird', 'Tweety', true);
  const penguin = AnimalFactory.createAnimal('bird', 'Pingu', false);
  
  dog.speak(); // 'Rex (German Shepherd) barks'
  cat.speak(); // 'Whiskers (black) meows'
  bird.speak(); // 'Tweety chirps'
  bird.fly(); // 'Tweety is flying'
  penguin.speak(); // 'Pingu chirps'
  penguin.fly(); // 'Pingu cannot fly'
}
\`\`\`

## 6. 继承的性能考虑

### 6.1 属性访问性能

原型链的深度会影响属性访问的性能，理解这一点对于优化代码很重要。

\`\`\`javascript
// 原型链深度与性能
function prototypeChainDepthAndPerformance() {
  // 创建深层原型链
  function Level0() {
    this.level0 = 'level0';
  }
  
  function Level1() {
    this.level1 = 'level1';
  }
  Level1.prototype = new Level0();
  
  function Level2() {
    this.level2 = 'level2';
  }
  Level2.prototype = new Level1();
  
  function Level3() {
    this.level3 = 'level3';
  }
  Level3.prototype = new Level2();
  
  function Level4() {
    this.level4 = 'level4';
  }
  Level4.prototype = new Level3();
  
  function Level5() {
    this.level5 = 'level5';
  }
  Level5.prototype = new Level4();
  
  const instance = new Level5();
  
  // 性能测试
  console.time('Access level0 property');
  for (let i = 0; i < 1000000; i++) {
    const value = instance.level0; // 需要遍历5层原型链
  }
  console.timeEnd('Access level0 property');
  
  console.time('Access level5 property');
  for (let i = 0; i < 1000000; i++) {
    const value = instance.level5; // 直接在实例上
  }
  console.timeEnd('Access level5 property');
  
  // 优化：缓存频繁访问的深层属性
  function optimizedAccess() {
    const level0Value = instance.level0; // 缓存到局部变量
    
    console.time('Optimized access');
    for (let i = 0; i < 1000000; i++) {
      const value = level0Value; // 直接访问局部变量
    }
    console.timeEnd('Optimized access');
  }
  
  optimizedAccess();
}

// 方法调用性能
function methodCallPerformance() {
  function Parent() {}
  Parent.prototype.parentMethod = function() {
    return 'parent method';
  };
  
  function Child() {}
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
  Child.prototype.childMethod = function() {
    return 'child method';
  };
  
  const child = new Child();
  
  // 性能测试：调用原型方法
  console.time('Call prototype method');
  for (let i = 0; i < 1000000; i++) {
    child.parentMethod(); // 需要在原型链中查找方法
  }
  console.timeEnd('Call prototype method');
  
  // 性能测试：调用实例方法
  child.instanceMethod = function() {
    return 'instance method';
  };
  
  console.time('Call instance method');
  for (let i = 0; i < 1000000; i++) {
    child.instanceMethod(); // 直接在实例上
  }
  console.timeEnd('Call instance method');
  
  // 优化：缓存方法引用
  const parentMethod = child.parentMethod;
  
  console.time('Cached method call');
  for (let i = 0; i < 1000000; i++) {
    parentMethod.call(child); // 使用缓存的方法引用
  }
  console.timeEnd('Cached method call');
}
\`\`\`

### 6.2 内存使用与垃圾回收

继承结构会影响内存使用和垃圾回收，特别是在创建大量实例时。

\`\`\`javascript
// 内存使用与继承
function memoryUsageAndInheritance() {
  // 原型链继承：方法共享，内存效率高
  function PrototypeInheritance() {
    this.data = new Array(1000).fill('data');
  }
  
  PrototypeInheritance.prototype.method = function() {
    return 'prototype method';
  };
  
  // 构造函数继承：方法不共享，内存效率低
  function ConstructorInheritance() {
    this.data = new Array(1000).fill('data');
    this.method = function() {
      return 'constructor method';
    };
  }
  
  // 创建大量实例
  const prototypeInstances = [];
  const constructorInstances = [];
  
  console.time('Create prototype instances');
  for (let i = 0; i < 10000; i++) {
    prototypeInstances.push(new PrototypeInheritance());
  }
  console.timeEnd('Create prototype instances');
  
  console.time('Create constructor instances');
  for (let i = 0; i < 10000; i++) {
    constructorInstances.push(new ConstructorInheritance());
  }
  console.timeEnd('Create constructor instances');
  
  // 内存使用对比
  if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
    console.log('Memory usage after creating prototype instances:', 
                window.performance.memory.usedJSHeapSize);
    
    // 清理
    prototypeInstances.length = 0;
    
    console.log('Memory usage after cleanup:', 
                window.performance.memory.usedJSHeapSize);
  }
}

// 垃圾回收与闭包
function garbageCollectionAndClosures() {
  function Parent() {
    this.largeData = new Array(1000000).fill('large data');
  }
  
  Parent.prototype.method = function() {
    return 'parent method';
  };
  
  function Child() {
    Parent.call(this);
    this.smallData = 'small data';
  }
  
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
  
  // 创建实例并保持引用
  const child = new Child();
  
  // 创建闭包引用实例
  const closure = function() {
    // 闭包引用了child实例，阻止垃圾回收
    return child.smallData;
  };
  
  // 即使child不再被直接访问，它仍然被closure引用
  child = null;
  
  // 手动解除引用
  // closure = null; // 取消注释以允许垃圾回收
  
  // 在实际应用中，要注意闭包对实例生命周期的影响
  // 特别是在事件处理器、定时器等场景中
}
\`\`\`

## 7. 继承的最佳实践

### 7.1 选择合适的继承模式

不同的继承模式适用于不同的场景，选择合适的模式很重要。

\`\`\`javascript
// 继承模式选择指南
function inheritancePatternSelection() {
  // 1. 简单场景：使用ES6类和extends
  class Animal {
    constructor(name) {
      this.name = name;
    }
    
    speak() {
      console.log(\`\${this.name} makes a sound\`);
    }
  }
  
  class Dog extends Animal {
    constructor(name, breed) {
      super(name);
      this.breed = breed;
    }
    
    speak() {
      console.log(\`\${this.name} barks\`);
    }
  }
  
  // 2. 需要动态组合：使用混入
  const canFly = {
    fly() {
      console.log(\`\${this.name} is flying\`);
    }
  };
  
  const canSwim = {
    swim() {
      console.log(\`\${this.name} is swimming\`);
    }
  };
  
  class Bird extends Animal {}
  
  Object.assign(Bird.prototype, canFly);
  
  // 3. 需要多重继承：使用混入函数
  function withMixins(Base, ...mixins) {
    return mixins.reduce((acc, mixin) => mixin(acc), Base);
  }
  
  class Duck extends withMixins(Animal, canFly, canSwim) {}
  
  // 4. 需要高性能：使用原型链继承
  function HighPerformanceClass() {}
  
  HighPerformanceClass.prototype.method = function() {
    // 方法在原型上，所有实例共享
  };
  
  // 5. 需要私有数据：使用闭包或Symbol
  const privateData = new WeakMap();
  
  class ClassWithPrivateData {
    constructor(data) {
      privateData.set(this, data);
    }
    
    getData() {
      return privateData.get(this);
    }
  }
}

// 继承层次设计原则
function inheritanceHierarchyDesign() {
  // 原则1：优先使用组合而非继承
  class Engine {
    start() {
      console.log('Engine started');
    }
  }
  
  class Car {
    constructor() {
      this.engine = new Engine(); // 组合
    }
    
    start() {
      this.engine.start();
      console.log('Car started');
    }
  }
  
  // 原则2：保持继承层次浅而简单
  class Animal {
    constructor(name) {
      this.name = name;
    }
    
    eat() {
      console.log(\`\${this.name} is eating\`);
    }
  }
  
  class Mammal extends Animal {
    constructor(name, furColor) {
      super(name);
      this.furColor = furColor;
    }
    
    giveBirth() {
      console.log(\`\${this.name} is giving birth\`);
    }
  }
  
  class Dog extends Mammal {
    constructor(name, furColor, breed) {
      super(name, furColor);
      this.breed = breed;
    }
    
    bark() {
      console.log(\`\${this.name} is barking\`);
    }
  }
  
  // 避免过深的继承层次
  // class GoldenRetriever extends Dog { ... } // 可能过度设计
  
  // 原则3：遵循里氏替换原则
  // 子类应该能够替换父类，而不破坏程序
  
  class Rectangle {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
    
    setWidth(width) {
      this.width = width;
    }
    
    setHeight(height) {
      this.height = height;
    }
    
    getArea() {
      return this.width * this.height;
    }
  }
  
  // 违反里氏替换原则的例子
  class Square extends Rectangle {
    constructor(side) {
      super(side, side);
    }
    
    setWidth(width) {
      this.width = width;
      this.height = width; // 正方形必须保持宽高相等
    }
    
    setHeight(height) {
      this.width = height;
      this.height = height;
    }
  }
  
  // Square不能完全替代Rectangle，因为它改变了Rectangle的行为
  
  // 更好的设计：使用组合而非继承
  class Shape {
    getArea() {
      throw new Error('Must implement getArea method');
    }
  }
  
  class RectangleShape extends Shape {
    constructor(width, height) {
      super();
      this.width = width;
      this.height = height;
    }
    
    getArea() {
      return this.width * this.height;
    }
  }
  
  class SquareShape extends Shape {
    constructor(side) {
      super();
      this.side = side;
    }
    
    getArea() {
      return this.side * this.side;
    }
  }
}
\`\`\`

### 7.2 避免常见的继承陷阱

JavaScript的继承机制有一些常见的陷阱，了解这些陷阱有助于编写更健壮的代码。

\`\`\`javascript
// 避免常见的继承陷阱
function avoidCommonInheritancePitfalls() {
  // 陷阱1：忘记修复constructor指向
  function Parent() {}
  
  function Child() {}
  
  Child.prototype = new Parent(); // 继承
  
  console.log(Child.prototype.constructor === Parent); // true
  console.log(Child.prototype.constructor === Child); // false
  
  // 修复
  Child.prototype.constructor = Child;
  console.log(Child.prototype.constructor === Child); // true
  
  // 陷阱2：在子类原型上添加属性
  Child.prototype.childProperty = 'child property';
  
  const child1 = new Child();
  const child2 = new Child();
  
  child1.childProperty = 'modified by child1';
  
  console.log(child1.childProperty); // 'modified by child1'（实例属性）
  console.log(child2.childProperty); // 'child property'（原型属性）
  
  // 陷阱3：使用for...in遍历属性
  for (const key in child1) {
    console.log(key); // 包括原型链上的所有可枚举属性
  }
  
  // 更好的方式：使用Object.keys或hasOwnProperty
  Object.keys(child1).forEach(key => {
    console.log(key); // 只包括实例自身的可枚举属性
  });
  
  for (const key in child1) {
    if (child1.hasOwnProperty(key)) {
      console.log(key); // 只包括实例自身的属性
    }
  }
  
  // 陷阱4：修改原型对象
  const originalPrototype = Child.prototype;
  
  Child.prototype.newMethod = function() {
    console.log('New method');
  };
  
  // 所有实例（包括已创建的）都能访问新方法
  child1.newMethod(); // 'New method'
  
  // 陷阱5：重写原型对象
  Child.prototype = {
    newMethod: function() {
      console.log('New method');
    }
  };
  
  // 现有实例不再能访问新原型
  // child1.newMethod(); // TypeError: child1.newMethod is not a function
  
  // 新实例使用新原型
  const child3 = new Child();
  child3.newMethod(); // 'New method'
  
  // 陷阱6：实例属性与原型属性同名
  Child.prototype.sharedProperty = 'shared value';
  
  const child4 = new Child();
  child4.sharedProperty = 'instance value';
  
  console.log(child4.sharedProperty); // 'instance value'（实例属性遮蔽原型属性）
  
  delete child4.sharedProperty;
  console.log(child4.sharedProperty); // 'shared value'（重新访问原型属性）
}

// 安全的继承模式
function safeInheritancePatterns() {
  // 使用Object.create创建继承
  function safeInheritance(child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
    
    return child;
  }
  
  function Parent(name) {
    this.name = name;
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    Parent.call(this, name);
    this.age = age;
  }
  
  safeInheritance(Child, Parent);
  
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  const child = new Child('Alice', 25);
  child.sayName(); // 'Alice'
  child.sayAge();  // 25
  
  // 使用工厂函数创建继承
  function inherit(child, parent) {
    // 创建中间构造函数
    function Middle() {}
    Middle.prototype = parent.prototype;
    
    // 设置子类原型
    child.prototype = new Middle();
    child.prototype.constructor = child;
    
    // 保存父类原型的引用
    child.superclass = parent.prototype;
    
    if (parent.prototype.constructor === Object.prototype.constructor) {
      parent.prototype.constructor = parent;
    }
    
    return child;
  }
  
  function AnotherChild(name, age) {
    AnotherChild.superclass.constructor.call(this, name);
    this.age = age;
  }
  
  inherit(AnotherChild, Parent);
  
  AnotherChild.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  const anotherChild = new AnotherChild('Bob', 30);
  anotherChild.sayName(); // 'Bob'
  anotherChild.sayAge();  // 30
}
\`\`\`

## 结论

JavaScript的原型链与继承机制是这门语言最核心也最独特的特性之一。与基于类的继承系统不同，JavaScript使用原型链实现对象之间的属性和方法共享，这种机制既灵活又强大。

通过深入理解原型链和继承机制，我们可以：

1. 选择合适的继承模式，根据场景使用原型链继承、构造函数继承、组合继承或ES6类继承
2. 避免常见的继承陷阱，如忘记修复constructor指向、原型属性与实例属性冲突等
3. 优化继承结构的性能，减少原型链深度，合理使用缓存
4. 利用混入模式实现多重继承的效果，提高代码的复用性
5. 遵循继承设计的最佳实践，如优先使用组合而非继承、保持继承层次浅而简单等

随着JavaScript语言的发展，ES6引入的\`class\`和\`extends\`语法提供了更简洁的继承表达方式，但底层仍然是基于原型的机制。理解原型链的工作原理，对于掌握JavaScript面向对象编程至关重要。

无论是传统的原型继承，还是现代的ES6类继承，其核心都是对象之间的委托关系。掌握这一核心概念，将帮助我们编写出更清晰、更灵活、更易维护的JavaScript代码。`;export{n as default};
//# sourceMappingURL=10-CGP_ATXf.js.map
