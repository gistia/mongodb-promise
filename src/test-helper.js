const _ = require('lodash');

const Client = require('./client');

class TestHelper {
  constructor(collectionName, urlOrOptions) {
    this.collectionName = collectionName || 'tests';
    if (_.isObject(urlOrOptions)) {
      const { url, poolSize } = urlOrOptions;
      this.client = new Client(url, { url, poolSize });
    } else {
      this.client = new Client(urlOrOptions, { poolSize: 2 });
    }
  }

  setupData(data) {
    return new Promise((resolve, reject) => {
      this.client.withCollection(this.collectionName).then(({ conn, collection }) => {
        collection.insert(data, (err, doc) => {
          this.client.close(conn);
          if (err) { return reject(err); }
          resolve(doc);
        });
      }, reject).catch(reject);
    });
  }

  retrieveData() {
    return new Promise((resolve, reject) => {
      this.client.withCollection(this.collectionName).then(({ conn, collection }) => {
        collection.find({}).toArray((err, docs) => {
          this.client.close(conn);
          if (err) { return reject(err); }
          resolve(docs);
        });
      }, reject).catch(reject);
    });
  }

  eraseCollection() {
    return new Promise((resolve, reject) => {
      this.client.connect().then(db => {
        db.collection(this.collectionName).remove().then(_ => {
          this.client.close(db);
          resolve();
        });
      }, reject).catch(reject);
    });
  }
}

module.exports = TestHelper;
