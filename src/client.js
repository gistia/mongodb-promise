const client = require('mongodb').MongoClient;
const Promise = require('es6-promise').Promise;

const QueryBuilder = require('./query-builder');

class Client {
  connect() {
    return new Promise((resolve, reject) => {
      client.connect(process.env.MONGODB_URL, (err, db) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(db);
      });
    });
  }

  collection(name) {
    return new Promise((resolve, reject) => {
      this.connect().then(db => resolve(db.collection(name)), reject).catch(reject);
    });
  }

  query(collection) {
    return new QueryBuilder(collection, this);
  }

  insert(collectionName, doc) {
    return new Promise((resolve, reject) => {
      this.collection(collectionName).then(collection => {
        collection.insert(doc, (err, result) => {
          if (err) { return reject(err); }
          resolve(result);
        });
      });
    });
  }
}

module.exports = Client;
