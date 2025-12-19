const n=`---
title: "JavaScript原型链与继承机制(2)：继承模式详解"
excerpt: "深入探讨JavaScript各种继承模式，从原型链继承到ES6类继承，分析每种模式的优缺点及适用场景"
coverImage: "/assets/blog/preview/cover.jpg"
date: "2025-09-12"
author:
  name: 小羽
  picture: "/assets/blog/authors/jj.jpeg"
ogImage:
  url: "/assets/blog/hello-world/cover.jpg"
categories: ["JavaScript"]
---

# JavaScript原型链与继承机制(2)：继承模式详解

## 引言

在上一篇文章中，我们了解了JavaScript原型链的基本概念和工作原理。本文将深入探讨JavaScript中的各种继承模式，从原型链继承到ES6类继承，分析每种模式的优缺点及适用场景，帮助您选择最适合的继承方式。

## 3. JavaScript继承模式

### 3.1 原型链继承

原型链继承是最基本的继承方式，它通过将子类型的原型指向父类型的实例来实现继承。

\`\`\`javascript
// 原型链继承
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
  
  // 问题1：引用类型属性被所有实例共享
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue', 'yellow'] (受影响)
  
  // 问题2：创建子类型实例时无法向父类型构造函数传递参数
  console.log(child1.name); // undefined (Parent构造函数未执行)
}

// 原型链继承的改进
function improvedPrototypeChainInheritance() {
  function Parent(name) {
    this.name = name;
    this.colors = ['red', 'green', 'blue'];
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    this.age = age;
    // 调用父类构造函数初始化实例属性
    Parent.call(this, name);
  }
  
  // 继承
  Child.prototype = new Parent();
  Child.prototype.constructor = Child;
  
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  const child1 = new Child('Alice', 25);
  const child2 = new Child('Bob', 30);
  
  child1.sayName(); // 'Alice'
  child1.sayAge(); // 25
  
  // 问题仍然存在：引用类型属性共享
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue', 'yellow']
}
\`\`\`

### 3.2 构造函数继承

构造函数继承通过在子类型构造函数中调用父类型构造函数来实现继承，解决了原型链继承中引用类型属性共享的问题。

\`\`\`javascript
// 构造函数继承
function constructorInheritance() {
  function Parent(name) {
    this.name = name;
    this.colors = ['red', 'green', 'blue'];
    this.sayName = function() {
      console.log(this.name);
    };
  }
  
  function Child(name, age) {
    // 继承Parent的属性
    Parent.call(this, name);
    this.age = age;
  }
  
  const child1 = new Child('Alice', 25);
  const child2 = new Child('Bob', 30);
  
  // 每个实例都有独立的colors副本
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue']
  
  // 可以向父类构造函数传递参数
  console.log(child1.name); // 'Alice'
  console.log(child2.name); // 'Bob'
  
  // 问题：方法在构造函数中定义，每个实例都有独立的方法副本
  console.log(child1.sayName === child2.sayName); // false
}

// 构造函数继承的优缺点
function constructorInheritanceProsAndCons() {
  function Parent(name) {
    this.name = name;
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    Parent.call(this, name); // 只继承实例属性
    this.age = age;
  }
  
  const child = new Child('Alice', 25);
  
  // 优点：解决了引用类型属性共享问题
  child.colors = ['red', 'green', 'blue']; // 每个实例独立
  
  // 优点：可以向父类构造函数传递参数
  console.log(child.name); // 'Alice'
  
  // 缺点：无法继承原型方法
  // child.sayName(); // TypeError: child.sayName is not a function
  
  // 缺点：方法在构造函数中定义，每个实例都有独立的方法副本
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  child.sayAge(); // 25
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
    // 继承属性（构造函数继承）
    Parent.call(this, name);
    this.age = age;
  }
  
  // 继承方法（原型链继承）
  Child.prototype = new Parent();
  Child.prototype.constructor = Child;
  
  // 添加子类方法
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  const child1 = new Child('Alice', 25);
  const child2 = new Child('Bob', 30);
  
  // 测试继承
  child1.sayName(); // 'Alice' (继承自Parent原型)
  child1.sayAge(); // 25 (Child原型方法)
  
  // 引用类型属性不共享
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue']
  
  // 可以向父类构造函数传递参数
  console.log(child1.name); // 'Alice'
  console.log(child2.name); // 'Bob'
  
  // 方法共享
  console.log(child1.sayName === child2.sayName); // true
  console.log(child1.sayAge === child2.sayAge); // true
}

// 组合继承的问题
function combinationInheritanceProblem() {
  function Parent(name) {
    this.name = name;
    console.log('Parent constructor called');
  }
  
  function Child(name, age) {
    Parent.call(this, name); // 第一次调用Parent构造函数
    this.age = age;
  }
  
  Child.prototype = new Parent(); // 第二次调用Parent构造函数
  Child.prototype.constructor = Child;
  
  const child = new Child('Alice', 25);
  // 输出:
  // Parent constructor called
  // Parent constructor called
  
  // 问题：父类构造函数被调用了两次
  // 第一次：在设置子类原型时
  // 第二次：在创建子类实例时
}
\`\`\`

### 3.4 原型式继承

原型式继承是一种不依赖构造函数的继承方式，它基于已有的对象创建新对象。

\`\`\`javascript
// 原型式继承
function prototypalInheritance() {
  // 基本实现
  function object(o) {
    function F() {}
    F.prototype = o;
    return new F();
  }
  
  const person = {
    name: 'Alice',
    friends: ['Bob', 'Charlie'],
    sayName: function() {
      console.log(this.name);
    }
  };
  
  const anotherPerson = object(person);
  anotherPerson.name = 'Greg';
  anotherPerson.friends.push('David');
  
  const yetAnotherPerson = object(person);
  yetAnotherPerson.name = 'Linda';
  
  console.log(person.friends); // ['Bob', 'Charlie', 'David']
  console.log(anotherPerson.friends); // ['Bob', 'Charlie', 'David']
  console.log(yetAnotherPerson.friends); // ['Bob', 'Charlie', 'David']
  
  // 问题：引用类型属性仍然共享
}

// Object.create方法
function objectCreateMethod() {
  const person = {
    name: 'Alice',
    friends: ['Bob', 'Charlie'],
    sayName: function() {
      console.log(this.name);
    }
  };
  
  // 使用Object.create实现原型式继承
  const anotherPerson = Object.create(person);
  anotherPerson.name = 'Greg';
  anotherPerson.friends.push('David');
  
  const yetAnotherPerson = Object.create(person);
  yetAnotherPerson.name = 'Linda';
  
  console.log(person.friends); // ['Bob', 'Charlie', 'David']
  console.log(anotherPerson.friends); // ['Bob', 'Charlie', 'David']
  console.log(yetAnotherPerson.friends); // ['Bob', 'Charlie', 'David']
  
  // Object.create的第二个参数可以定义新对象的属性
  const personWithDescriptor = Object.create(person, {
    name: {
      value: 'Custom Name',
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
  
  console.log(personWithDescriptor.name); // 'Custom Name'
  console.log(personWithDescriptor.age); // 25
  console.log(personWithDescriptor.friends); // ['Bob', 'Charlie', 'David']
}
\`\`\`

### 3.5 寄生式继承

寄生式继承是原型式继承的增强版，它在创建对象后增强对象的功能。

\`\`\`javascript
// 寄生式继承
function parasiticInheritance() {
  function createAnother(original) {
    const clone = Object.create(original); // 创建新对象
    
    // 增强对象
    clone.sayHi = function() {
      console.log('Hi');
    };
    
    return clone;
  }
  
  const person = {
    name: 'Alice',
    friends: ['Bob', 'Charlie']
  };
  
  const anotherPerson = createAnother(person);
  anotherPerson.sayHi(); // 'Hi'
  console.log(anotherPerson.name); // 'Alice'
  
  // 问题：方法在每次创建对象时都会重新创建
  const yetAnotherPerson = createAnother(person);
  console.log(anotherPerson.sayHi === yetAnotherPerson.sayHi); // false
}

// 寄生式继承与构造函数结合
function parasiticInheritanceWithConstructor() {
  function Parent(name) {
    this.name = name;
    this.colors = ['red', 'green', 'blue'];
  }
  
  Parent.prototype.sayName = function() {
    console.log(this.name);
  };
  
  function Child(name, age) {
    Parent.call(this, name);
    this.age = age;
  }
  
  // 寄生式继承
  function inheritPrototype(child, parent) {
    const prototype = Object.create(parent.prototype); // 创建对象
    prototype.constructor = child; // 增强对象
    child.prototype = prototype; // 指定对象
  }
  
  inheritPrototype(Child, Parent);
  
  Child.prototype.sayAge = function() {
    console.log(this.age);
  };
  
  const child1 = new Child('Alice', 25);
  const child2 = new Child('Bob', 30);
  
  child1.sayName(); // 'Alice'
  child1.sayAge(); // 25
  
  // 引用类型属性不共享
  child1.colors.push('yellow');
  console.log(child1.colors); // ['red', 'green', 'blue', 'yellow']
  console.log(child2.colors); // ['red', 'green', 'blue']
  
  // 方法共享
  console.log(child1.sayName === child2.sayName); // true
  console.log(child1.sayAge === child2.sayAge); // true
  
  // 父类构造函数只调用一次
}
\`\`\`

## 4. ES6中的类与继承

ES6引入了\`class\`和\`extends\`关键字，提供了更简洁的继承语法，但底层仍然是基于原型的机制。

### 4.1 类的定义与使用

ES6的类本质上是语法糖，它提供了更清晰的面向对象编程语法。

\`\`\`javascript
// ES6类的定义
function es6ClassDefinition() {
  // 基本类定义
  class Person {
    // 构造函数
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }
    
    // 实例方法
    sayHello() {
      console.log(\`Hello, my name is \${this.name} and I'm \${this.age} years old.\`);
    }
    
    // 静态方法
    static createAdult(name) {
      return new Person(name, 18);
    }
  }
  
  // 创建实例
  const person = new Person('Alice', 25);
  person.sayHello(); // "Hello, my name is Alice and I'm 25 years old."
  
  // 使用静态方法
  const adult = Person.createAdult('Bob');
  console.log(adult.age); // 18
  
  // 类表达式
  const Animal = class {
    constructor(name) {
      this.name = name;
    }
    
    speak() {
      console.log(\`\${this.name} makes a sound\`);
    }
  };
  
  const animal = new Animal('Dog');
  animal.speak(); // "Dog makes a sound"
  
  // 命名类表达式
  const Car = class MyCar {
    constructor(brand) {
      this.brand = brand;
    }
    
    getBrand() {
      console.log(\`This is a \${this.brand}\`);
      
      // 类名只在类内部可见
      // console.log(MyCar); // [Function: MyCar]
    }
  };
  
  const car = new Car('Toyota');
  car.getBrand(); // "This is a Toyota"
  
  // MyCar在这里不可访问
  // console.log(MyCar); // ReferenceError: MyCar is not defined
}

// 类的高级特性
function advancedClassFeatures() {
  class Person {
    // 私有字段（ES2022）
    #privateField = 'private value';
    
    // 静态私有字段（ES2022）
    static #staticPrivateField = 'static private value';
    
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }
    
    // 公共方法
    sayHello() {
      console.log(\`Hello, my name is \${this.name} and I'm \${this.age} years old.\`);
      console.log(this.#privateField); // 可以访问私有字段
    }
    
    // 私有方法（ES2022）
    #privateMethod() {
      console.log('This is a private method');
    }
    
    // 调用私有方法
    callPrivateMethod() {
      this.#privateMethod();
    }
    
    // Getter方法
    get info() {
      return \`\${this.name} is \${this.age} years old\`;
    }
    
    // Setter方法
    set age(value) {
      if (value >= 0 && value <= 150) {
        this._age = value;
      } else {
        throw new Error('Invalid age');
      }
    }
    
    get age() {
      return this._age;
    }
    
    // 静态方法
    static createAdult(name) {
      return new Person(name, 18);
    }
    
    // 静态块（ES2022）
    static {
      console.log('Class Person is being defined');
      console.log(Person.#staticPrivateField);
    }
  }
  
  const person = new Person('Alice', 25);
  person.sayHello();
  person.callPrivateMethod();
  console.log(person.info);
  
  person.age = 30;
  console.log(person.age);
  
  // 访问私有字段会报错
  // console.log(person.#privateField); // SyntaxError: Private field '#privateField' must be declared in an enclosing class
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
\`\`\`

## 结论

JavaScript提供了多种继承模式，每种模式都有其优缺点和适用场景：

1. **原型链继承**：最简单的继承方式，但存在引用类型属性共享和无法向父类构造函数传递参数的问题
2. **构造函数继承**：解决了引用类型属性共享问题，但无法继承原型方法
3. **组合继承**：结合了前两种方式的优点，是最常用的继承模式，但父类构造函数会被调用两次
4. **原型式继承**：不依赖构造函数的继承方式，适合简单的对象复制
5. **寄生式继承**：原型式继承的增强版，可以在创建对象后增强对象功能
6. **ES6类继承**：提供了更简洁的语法，但底层仍然是基于原型的机制

选择合适的继承模式取决于具体场景和需求。在下一篇文章中，我们将探讨高级继承技巧、性能考虑以及继承的最佳实践。`;export{n as default};
//# sourceMappingURL=10-2-Dc7HklrP.js.map
