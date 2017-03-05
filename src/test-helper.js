const Promise = require('es6-promise').Promise;
const Client = require('./client.js');

const client = new Client();

class TestHelper {
  constructor(collectionName) {
    this.collectionName = collectionName || 'tests';
  }

  setupData(data) {
    return new Promise((resolve, reject) => {
      this.connect().then(collection => {
        collection.insert(data, (err, doc) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(doc);
        });
      });
    });
  }

  retrieveData() {
    return new Promise((resolve, reject) => {
      this.connect().then(collection => {
        collection.find({}).toArray((err, docs) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(docs);
        });
      });
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      client.connect().then(db => {
        resolve(db.collection(this.collectionName));
      }, reject);
    });
  }

  eraseCollection() {
    return new Promise((resolve, reject) => {
      client.connect().then(db => {
        db.collection(this.collectionName).remove();
        resolve();
      }, reject).catch(reject);
    });
  }
}

module.exports = TestHelper;
