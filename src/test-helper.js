const Client = require('./client');

class TestHelper {
  constructor(collectionName, mongoUrl) {
    this.collectionName = collectionName || 'tests';
    this.client = new Client(mongoUrl);
  }

  setupData(data) {
    return new Promise((resolve, reject) => {
      this.client.withCollection(this.collectionName).then(({ conn, collection }) => {
        collection.insert(data, (err, doc) => {
          conn.close();
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
          conn.close();
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
          db.close();
          resolve();
        });
      }, reject).catch(reject);
    });
  }
}

module.exports = TestHelper;
