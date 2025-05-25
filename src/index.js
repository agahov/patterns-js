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

  isFull() {
    return this.total >= this.limit;
  }

  getResult() {
    return Promise.resolve({
      items: this.items,
      total: this.total,
      errors: this.errors
    });
  }
}

class PurchaseProcessor {
  constructor(iterator, basket) {
    this.iterator = iterator;
    this.basket = basket;
  }

  async process() {
    try {
      for await (const item of this.iterator) {
        const added = this.basket.add(item);
        if (!added) {
          console.log(`Skipping ${item.name} due to limit`);
          // If basket is full, break the loop
          if (this.basket.isFull()) {
            console.log('Basket is full, stopping processing');
            break;
          }
        }
      }
      return await this.basket.getResult();
    } catch (error) {
      return Promise.reject({
        error,
        basket: await this.basket.getResult()
      });
    }
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
  const basket = new Basket({ limit: 200 }, (items, total) => {
    console.log(total);
  });
  
  const processor = new PurchaseProcessor(goods, basket);
  
  try {
    const result = await processor.process();
    console.log('Final basket contents:', result.items);
    console.log('Total:', result.total);
    console.log('Errors:', result.errors);
  } catch (error) {
    console.error('Processing error:', error);
  }
};

main();