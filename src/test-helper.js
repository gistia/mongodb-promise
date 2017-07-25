const Client = require('./client');

class TestHelper {
  constructor(collectionName, mongoUrl) {
    this.collectionName = collectionName || 'tests';
    this.client = new Client(mongoUrl);
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
      this.client.connect().then(db => {
        resolve(db.collection(this.collectionName));
      }, reject);
    });
  }

  eraseCollection() {
    return new Promise((resolve, reject) => {
      this.client.connect().then(db => {
        db.collection(this.collectionName).remove().then(_ => {
          resolve();
        });
      }, reject).catch(reject);
    });
  }
}

module.exports = TestHelper;
