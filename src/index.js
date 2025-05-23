'use strict';

// Create Iterator for given dataset with Symbol.asyncIterator
// Use for..of to iterate it and pass data to Basket
// Basket is limited to certain amount
// After iteration ended Basket should return Thenable
// to notify us with final list of items, total and
// escalated errors

class PurchaseIterator {
  constructor(items) {
    this.items = items;
    this.index = 0;
  }

  static create(items) {
    return new PurchaseIterator(items);
  }

  [Symbol.asyncIterator]() {
    return {
      next: async () => {
        if (this.index < this.items.length) {
          const item = this.items[this.index++];
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100));
          return { value: item, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

class Basket {
  constructor({ limit }, callback) {
    this.limit = limit;
    this.items = [];
    this.total = 0;
    this.errors = [];
    this.callback = callback;
  }

  add(item) {
    if (this.total + item.price > this.limit) {
      this.errors.push(`Cannot add ${item.name}: would exceed limit of ${this.limit}`);
      return false;
    }
    this.items.push(item);
    this.total += item.price;
    return true;
  }

  getResult() {
    return Promise.resolve({
      items: this.items,
      total: this.total,
      errors: this.errors
    });
  }
}

const purchase = [
  { name: 'Laptop',  price: 1500 },
  { name: 'Mouse',  price: 25 },
  { name: 'Keyboard',  price: 100 },
  { name: 'HDMI cable',  price: 10 },
  { name: 'Bag', price: 50 },
  { name: 'Mouse pad', price: 5 },
];

const main = async () => {
  const goods = PurchaseIterator.create(purchase);
  const basket = new Basket({ limit: 1050 }, (items, total) => {
    console.log(total);
  });
  
  for await (const item of goods) {
    basket.add(item);
  }
  
  const result = await basket.getResult();
  console.log('Final basket contents:', result.items);
  console.log('Total:', result.total);
  console.log('Errors:', result.errors);
};

main();