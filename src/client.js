const client = require('mongodb').MongoClient;

const QueryBuilder = require('./query-builder');
const { fixId } = require('./utils');

class Client {
  constructor(url) {
    this.url = url || process.env.MONGODB_URL;
  }

  init() {
    return new Promise((resolve, reject) => {
      client.connect(this.url).then(connection => {
        this.connection = connection;
        resolve(connection);
      }).catch(reject);
    });
  }

  connect() {
    return Promise.resolve(this.connection);
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
          if (err) { return reject(err); }
          resolve(result);
        });
      }, reject).catch(reject);
    });
  }
}

module.exports = Client;
