const client = require('mongodb').MongoClient;
const uuid = require('uuid/v1');

const ConnectionPool = require('./pool');
const QueryBuilder = require('./query-builder');
const { fixId } = require('./utils');

class Client {
  constructor(url, usePool=true) {
    this.url = url || process.env.MONGODB_URL;
    this.num = uuid().split('-')[0];
    if (usePool) {
      this.pool = new ConnectionPool(this);
    }
  }

  connect() {
    if (this.pool) {
      return this.pool.acquire();
    }
    return this.performConnect();
  }

  close(conn) {
    if (this.pool) {
      return this.pool.release(conn);
    }
    return this.performClose(conn);
  }

  performConnect() {
    return Promise.promisify(client.connect.bind(client))(this.url);
  }

  performClose(conn) {
    return Promise.promisify(conn.close)();
  }

  collection(conn, name) {
    return Promise.promisify(conn.collection.bind(conn))(name);
  }

  query(collection) {
    return new QueryBuilder(collection, this);
  }

  withCollection(name) {
    return new Promise((resolve, reject) => {
      return this.connect().then(conn => {
        return this.collection(conn, name).then(collection => {
          resolve({ conn, collection });
        }, reject).catch(reject);
      }, reject).catch(reject);
    });
  }

  update(collectionName, filter, update) {
    return new Promise((resolve, reject) => {
      fixId(filter);
      this.withCollection(collectionName).then(({ conn, collection }) => {
        collection.update(filter, update, (err, result) => {
          this.close(conn);
          if (err) { return reject(err); }
          resolve(result);
        });
      }, reject).catch(reject);
    });
  }

  insert(collectionName, doc) {
    return new Promise((resolve, reject) => {
      this.withCollection(collectionName).then(({ conn, collection }) => {
        collection.insert(doc, (err, result) => {
          this.close(conn);
          if (err) { return reject(err); }
          resolve(result);
        });
      }, reject).catch(reject);
    });
  }

  remove(collectionName, filter) {
    return new Promise((resolve, reject) => {
      this.withCollection(collectionName).then(({ conn, collection }) => {
        collection.deleteMany(filter, (err, result) => {
          this.close(conn);
          if (err) { return reject(err); }
          resolve(result);
        });
      }, reject).catch(reject);
    });
  }
}

module.exports = Client;
