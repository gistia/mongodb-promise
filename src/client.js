const client = require('mongodb').MongoClient;

const QueryBuilder = require('./query-builder');
const { fixId } = require('./utils');

class Client {
  constructor(url) {
    this.url = url || process.env.MONGODB_URL;
  }

  get connectionOptions() {
    const getInt = (v, defVal) => {
      const intVal = parseInt(v, 10);
      if (isNaN(intVal)) {
        return defVal;
      }
      return intVal;
    }

    return {
      poolSize: getInt(process.env.MONGODB_POOL_SIZE, 10),
    };
  }

  connect() {
    if (this.connection) {
      return Promise.resolve(this.connection);
    }

    console.log(' *** options', this.connectionOptions);

    return new Promise((resolve, reject) => {
      client.connect(this.url, this.connectionOptions, (err, db) => {
        if (err) {
          reject(err);
          return;
        }

        this.connection = db;
        resolve(db);
      });
    });
  }

  collection(name) {
    return new Promise((resolve, reject) => {
      this.connect().then(db => resolve(db.collection(name)), reject).catch(reject);
    });
  }

  close() {
    const conn = this.connection;
    this.connection = null;
    conn.close();
  }

  query(collection) {
    return new QueryBuilder(collection, this);
  }

  update(collectionName, filter, update) {
    fixId(filter);
    return new Promise((resolve, reject) => {
      this.collection(collectionName).then(collection => {
        collection.update(filter, update, (err, result) => {
          if (err) { return reject(err); }
          resolve(result);
        });
      });
    });
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

  remove(collectionName, filter) {
    return new Promise((resolve, reject) => {
      this.collection(collectionName).then(collection => {
        collection.deleteMany(filter, (err, result) => {
          if (err) { return reject(err); }
          resolve(result);
        });
      });
    });
  }
}

module.exports = Client;
