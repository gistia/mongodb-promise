const Client = require('./client');

class TestHelper {
  constructor(collectionName, mongoUrl) {
    this.collectionName = collectionName || 'tests';
    this.client = new Client(mongoUrl);
  }

  init() {
    return this.client.init();
  }

  setupData(data) {
    return new Promise((resolve, reject) => {
      this.init().then(_ => {
        this.client.withCollection(this.collectionName).then(({ conn, collection }) => {
          collection.insert(data, (err, doc) => {
            if (err) { return reject(err); }
            resolve(doc);
          });
        }).catch(reject);
      }).catch(reject);
    });
  }

  retrieveData() {
    return new Promise((resolve, reject) => {
      this.client.init().then(_ => {
        this.client.withCollection(this.collectionName).then(({ conn, collection }) => {
          collection.find({}).toArray((err, docs) => {
            if (err) { return reject(err); }
            resolve(docs);
          });
        }, reject).catch(reject);
      });
    });
  }

  eraseCollection() {
    return new Promise((resolve, reject) => {
      this.client.init().then(db => {
        db.collection(this.collectionName).remove().then(_ => {
          db.close();
          resolve();
        });
      }).catch(reject);
    });
  }
}

module.exports = TestHelper;
