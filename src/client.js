const client = require('mongodb').MongoClient;

const QueryBuilder = require('./query-builder');
const { fixId } = require('./utils');

class Client {
  constructor(url) {
    this.url = url || process.env.MONGODB_URL;
  }

  connect() {
    return new Promise((resolve, reject) => {
      client.connect(this.url, (err, db) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(db);
      });
    });
  }

  collection(conn, name) {
    return Promise.promisify(conn.collection.bind(conn))(name);
  }

  query(collection) {
    return new QueryBuilder(collection, this);
  }

  update(collectionName, filter, update) {
    fixId(filter);
    return new Promise((resolve, reject) => {
      this.connect().then(conn => {
        this.collection(conn, collectionName).then(collection => {
          collection.update(filter, update, (err, result) => {
            conn.close();
            if (err) { return reject(err); }
            resolve(result);
          });
        }, reject).catch(reject);
      }, reject).catch(reject);
    });
  }

  insert(collectionName, doc) {
    return new Promise((resolve, reject) => {
      this.connect().then(conn => {
        this.collection(conn, collectionName).then(collection => {
          collection.insert(doc, (err, result) => {
            conn.close();
            if (err) { return reject(err); }
            resolve(result);
          });
        }, reject).catch(reject);
      }, reject).catch(reject);
    });
  }

  remove(collectionName, filter) {
    return new Promise((resolve, reject) => {
      this.connect().then(conn => {
        this.collection(conn, collectionName).then(collection => {
          collection.deleteMany(filter, (err, result) => {
            conn.close();
            if (err) { return reject(err); }
            resolve(result);
          });
        }, reject).catch(reject);
      }, reject).catch(reject);
    });
  }
}

module.exports = Client;
