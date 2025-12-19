const n=`---
title: "JavaScript原型链与继承机制(1)：原型与原型对象"
excerpt: "深入探讨JavaScript原型与原型对象的基本概念，解析原型链工作原理与属性查找机制，帮助理解JavaScript继承基础"
coverImage: "/assets/blog/dynamic-routing/cover.jpg"
date: "2025-09-11"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
categories: ["JavaScript"]
---

# JavaScript原型链与继承机制(1)：原型与原型对象

## 引言

JavaScript的原型链与继承机制是这门语言最核心也最独特的特性之一。与基于类的继承系统不同，JavaScript使用原型链实现对象之间的属性和方法共享，这种机制既灵活又强大。本系列文章将深入探讨JavaScript的原型链与继承机制，从基础概念到高级应用，帮助您全面理解这一重要特性。

## 1. 原型与原型对象

### 1.1 原型对象的基本概念

在JavaScript中，每个函数都有一个特殊的属性\`prototype\`，这个属性指向一个对象，称为原型对象。当我们使用构造函数创建实例时，这些实例会自动拥有一个内部属性\`[[Prototype]]\`（在大多数浏览器中可以通过\`__proto__\`访问），指向构造函数的原型对象。

\`\`\`javascript
// 原型对象基本概念
function prototypeBasics() {
  // 构造函数
  function Person(name, age) {
    this.name = name;
    this.age = age;
  }
  
  // 在原型对象上添加方法
  Person.prototype.sayHello = function() {
    console.log(\`Hello, my name is \${this.name} and I'm \${this.age} years old.\`);
  };
  
  // 创建实例
  const person1 = new Person('Alice', 25);
  const person2 = new Person('Bob', 30);
  
  // 调用原型方法
  person1.sayHello(); // "Hello, my name is Alice and I'm 25 years old."
  person2.sayHello(); // "Hello, my name is Bob and I'm 30 years old."
  
  // 检查原型关系
  console.log(person1.__proto__ === Person.prototype); // true
  console.log(person2.__proto__ === Person.prototype); // true
  
  // 实例共享原型方法
  console.log(person1.sayHello === person2.sayHello); // true
}

// 原型对象的动态性
function prototypeDynamics() {
  function Animal(name) {
    this.name = name;
  }
  
  const animal1 = new Animal('Animal1');
  const animal2 = new Animal('Animal2');
  
  // 在创建实例后添加原型方法
  Animal.prototype.eat = function() {
    console.log(\`\${this.name} is eating\`);
  };
  
  // 已创建的实例也能访问新添加的原型方法
  animal1.eat(); // "Animal1 is eating"
  animal2.eat(); // "Animal2 is eating"
  
  // 修改原型方法
  Animal.prototype.eat = function() {
    console.log(\`\${this.name} is eating happily\`);
  };
  
  animal1.eat(); // "Animal1 is eating happily"
  animal2.eat(); // "Animal2 is eating happily"
}
\`\`\`

### 1.2 原型链的工作原理

原型链是JavaScript实现继承的核心机制。当我们访问一个对象的属性时，如果对象本身没有这个属性，JavaScript引擎会沿着原型链向上查找，直到找到该属性或到达原型链的末端（\`Object.prototype\`，其\`__proto__\`为\`null\`）。

\`\`\`javascript
// 原型链工作原理
function prototypeChainMechanism() {
  // 祖先构造函数
  function Animal() {
    this.type = 'animal';
  }
  
  Animal.prototype.breathe = function() {
    console.log('Breathing...');
  };
  
  // 父构造函数
  function Mammal() {
    this.category = 'mammal';
  }
  
  // 设置原型链：Mammal.prototype -> Animal.prototype
  Mammal.prototype = Object.create(Animal.prototype);
  Mammal.prototype.constructor = Mammal;
  
  Mammal.prototype.feedMilk = function() {
    console.log('Feeding milk...');
  };
  
  // 子构造函数
  function Dog(name) {
    this.name = name;
    this.breed = 'Unknown';
  }
  
  // 设置原型链：Dog.prototype -> Mammal.prototype
  Dog.prototype = Object.create(Mammal.prototype);
  Dog.prototype.constructor = Dog;
  
  Dog.prototype.bark = function() {
    console.log('Woof woof!');
  };
  
  // 创建实例
  const dog = new Dog('Rex');
  
  // 属性查找沿着原型链进行
  console.log(dog.name); // 'Rex' (实例属性)
  console.log(dog.breed); // 'Unknown' (实例属性)
  console.log(dog.category); // 'mammal' (Mammal.prototype)
  console.log(dog.type); // 'animal' (Animal.prototype)
  
  // 方法调用也沿着原型链进行
  dog.bark(); // 'Woof woof!' (Dog.prototype)
  dog.feedMilk(); // 'Feeding milk...' (Mammal.prototype)
  dog.breathe(); // 'Breathing...' (Animal.prototype)
  
  // 检查原型链
  console.log(dog instanceof Dog); // true
  console.log(dog instanceof Mammal); // true
  console.log(dog instanceof Animal); // true
  console.log(dog instanceof Object); // true
  
  // 原型链关系
  console.log(dog.__proto__ === Dog.prototype); // true
  console.log(dog.__proto__.__proto__ === Mammal.prototype); // true
  console.log(dog.__proto__.__proto__.__proto__ === Animal.prototype); // true
  console.log(dog.__proto__.__proto__.__proto__.__proto__ === Object.prototype); // true
  console.log(dog.__proto__.__proto__.__proto__.__proto__.__proto__ === null); // true
}

// 原型链与属性遮蔽
function propertyShadowing() {
  function Parent() {
    this.name = 'Parent';
  }
  
  Parent.prototype.name = 'Parent Prototype';
  Parent.prototype.getName = function() {
    return this.name;
  };
  
  function Child() {
    this.name = 'Child';
  }
  
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
  Child.prototype.name = 'Child Prototype';
  
  const child = new Child();
  
  // 实例属性遮蔽原型属性
  console.log(child.name); // 'Child' (实例属性)
  
  // 删除实例属性后访问原型属性
  delete child.name;
  console.log(child.name); // 'Child Prototype' (原型属性)
  
  // 删除原型属性后访问父原型属性
  delete Child.prototype.name;
  console.log(child.name); // 'Parent Prototype' (父原型属性)
}
\`\`\`

## 2. 属性访问与查找机制

### 2.1 属性查找过程

当我们访问一个对象的属性时，JavaScript引擎会按照以下步骤进行查找：

1. 首先检查对象自身是否有该属性
2. 如果没有，则查找对象的原型（\`__proto__\`）
3. 如果原型上也没有，则继续查找原型的原型
4. 重复此过程，直到找到属性或到达原型链末端（\`null\`）

\`\`\`javascript
// 属性查找过程详解
function propertyLookupProcess() {
  // 创建原型链
  function Grandparent() {}
  Grandparent.prototype.grandparentProperty = 'grandparent';
  
  function Parent() {}
  Parent.prototype = Object.create(Grandparent.prototype);
  Parent.prototype.constructor = Parent;
  Parent.prototype.parentProperty = 'parent';
  
  function Child() {}
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
  Child.prototype.childProperty = 'child';
  
  const child = new Child();
  child.ownProperty = 'own';
  
  // 属性查找过程
  console.log(child.ownProperty); // 'own' (在对象自身找到)
  console.log(child.childProperty); // 'child' (在Child.prototype找到)
  console.log(child.parentProperty); // 'parent' (在Parent.prototype找到)
  console.log(child.grandparentProperty); // 'grandparent' (在Grandparent.prototype找到)
  console.log(child.nonExistentProperty); // undefined (原型链末端未找到)
  
  // 使用hasOwnProperty检查属性是否在对象自身
  console.log(child.hasOwnProperty('ownProperty')); // true
  console.log(child.hasOwnProperty('childProperty')); // false
  console.log(child.hasOwnProperty('parentProperty')); // false
  console.log(child.hasOwnProperty('grandparentProperty')); // false
  console.log(child.hasOwnProperty('nonExistentProperty')); // false
  
  // 使用in操作符检查属性是否在对象或其原型链中
  console.log('ownProperty' in child); // true
  console.log('childProperty' in child); // true
  console.log('parentProperty' in child); // true
  console.log('grandparentProperty' in child); // true
  console.log('nonExistentProperty' in child); // false
}
\`\`\`

### 2.2 属性检查与描述符

JavaScript提供了多种方式来检查属性，并可以通过属性描述符来控制属性的行为。

\`\`\`javascript
// 属性检查与描述符
function propertyCheckingAndDescriptors() {
  function Person(name) {
    this.name = name;
  }
  
  Person.prototype.sayHello = function() {
    console.log(\`Hello, I'm \${this.name}\`);
  };
  
  const person = new Person('Alice');
  
  // hasOwnProperty vs in
  console.log(person.hasOwnProperty('name')); // true (实例属性)
  console.log(person.hasOwnProperty('sayHello')); // false (原型属性)
  console.log('name' in person); // true
  console.log('sayHello' in person); // true
  
  // Object.keys vs Object.getOwnPropertyNames
  console.log(Object.keys(person)); // ['name'] (只返回实例的可枚举属性)
  console.log(Object.getOwnPropertyNames(person)); // ['name'] (返回实例的所有自身属性)
  
  console.log(Object.keys(Person.prototype)); // ['sayHello'] (返回原型的可枚举属性)
  console.log(Object.getOwnPropertyNames(Person.prototype)); // ['constructor', 'sayHello'] (返回原型的所有自身属性)
  
  // 属性描述符
  const nameDescriptor = Object.getOwnPropertyDescriptor(person, 'name');
  console.log(nameDescriptor);
  // {
  //   value: 'Alice',
  //   writable: true,
  //   enumerable: true,
  //   configurable: true
  // }
  
  const sayHelloDescriptor = Object.getOwnPropertyDescriptor(Person.prototype, 'sayHello');
  console.log(sayHelloDescriptor);
  // {
  //   value: [Function: sayHello],
  //   writable: true,
  //   enumerable: true,
  //   configurable: true
  // }
  
  // 修改属性描述符
  Object.defineProperty(person, 'name', {
    writable: false,
    enumerable: false,
    configurable: false
  });
  
  person.name = 'Bob'; // 严格模式下会抛出TypeError
  console.log(person.name); // 'Alice' (只读属性)
  
  console.log(Object.keys(person)); // [] (name不再是可枚举属性)
  
  // 原型属性描述符
  Object.defineProperty(Person.prototype, 'sayHello', {
    writable: false,
    enumerable: false
  });
  
  // person.sayHello = function() { console.log('Modified'); }; // 严格模式下会抛出TypeError
  person.sayHello(); // 'Hello, I'm Alice' (只读方法)
  
  console.log(Object.keys(Person.prototype)); // [] (sayHello不再是可枚举属性)
}
\`\`\`

### 2.3 属性设置与遮蔽

当我们设置一个对象的属性时，如果该属性已存在于原型链中，会在对象自身创建一个新属性，从而"遮蔽"原型链中的同名属性。

\`\`\`javascript
// 属性设置与遮蔽
function propertySettingAndShadowing() {
  function Parent() {}
  Parent.prototype.sharedProperty = 'parent value';
  
  const child1 = {};
  const child2 = {};
  
  // 设置原型链
  Object.setPrototypeOf(child1, Parent.prototype);
  Object.setPrototypeOf(child2, Parent.prototype);
  
  // 读取原型属性
  console.log(child1.sharedProperty); // 'parent value'
  console.log(child2.sharedProperty); // 'parent value'
  
  // 设置属性：在对象自身创建新属性，遮蔽原型属性
  child1.sharedProperty = 'child1 value';
  
  console.log(child1.sharedProperty); // 'child1 value' (实例属性)
  console.log(child2.sharedProperty); // 'parent value' (原型属性)
  
  // 检查属性位置
  console.log(child1.hasOwnProperty('sharedProperty')); // true
  console.log(child2.hasOwnProperty('sharedProperty')); // false
  
  // 删除实例属性，重新访问原型属性
  delete child1.sharedProperty;
  console.log(child1.sharedProperty); // 'parent value' (原型属性)
  
  // 只读属性的特殊情况
  Object.defineProperty(Parent.prototype, 'readOnlyProperty', {
    value: 'read only',
    writable: false
  });
  
  console.log(child1.readOnlyProperty); // 'read only'
  
  // 在非严格模式下，设置只读属性会静默失败
  child1.readOnlyProperty = 'new value';
  console.log(child1.readOnlyProperty); // 'read only' (未改变)
  
  // 在严格模式下，设置只读属性会抛出TypeError
  // 'use strict';
  // child1.readOnlyProperty = 'new value'; // TypeError: Cannot assign to read only property
}
\`\`\`

## 3. 原型链继承的基本实现

原型链继承是JavaScript中最基本的继承方式，它通过将子类型的原型指向父类型的实例来实现继承。

\`\`\`javascript
// 原型链继承基本实现
function prototypeChainInheritance() {
  // 父类型
  function Parent(name) {
    this.name = name;
    this.colors = ['red', 'green', 'blue'];
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  // 子类型
  function Child(name, age) {
    this.age = age;
  }
  
  // 实现继承：Child.prototype指向Parent的实例
  Child.prototype = new Parent();
  
  // 修复constructor指向
  Child.prototype.constructor = Child;
  
  // 在子类型原型上添加方法
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  // 创建实例
  const child1 = new Child('Alice', 25);
  const child2 = new Child('Bob', 30);
  
  // 测试继承
  child1.sayName(); // 'Alice' (继承自Parent)
  child1.sayAge(); // 25 (Child自身方法)
  
  // 问题：引用类型属性被所有实例共享
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue', 'yellow'] (受影响)
  
  // 问题：创建子类型实例时无法向父类型构造函数传递参数
  console.log(child1.name); // undefined (Parent构造函数未执行)
}
\`\`\`

原型链继承虽然简单，但存在明显的问题：引用类型属性会被所有实例共享，且在创建子类型实例时无法向父类型构造函数传递参数。这些问题需要通过其他继承模式来解决。

## 结论

JavaScript的原型链与继承机制是基于原型的面向对象编程的核心。通过理解原型对象、原型链的工作原理以及属性访问与查找机制，我们可以更好地掌握JavaScript的继承特性。

原型链继承是最基本的继承方式，但它存在引用类型属性共享和无法向父类构造函数传递参数的问题。在下一篇文章中，我们将探讨更完善的继承模式，包括构造函数继承、组合继承等，以解决这些问题。`;export{n as default};
//# sourceMappingURL=10-1-wMH4T6E7.js.map
