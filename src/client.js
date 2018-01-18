const client = require('mongodb').MongoClient;
const Promise = require('bluebird');
const promiseRetry = require('promise-retry');

const QueryBuilder = require('./query-builder');
const { fixId } = require('./utils');

class Client {
  constructor(url) {
    this.url = url || process.env.MONGODB_URL;
  }

  init() {
    const opts = {};
    if (process.env.MONGODB_POOL_SIZE) {
      opts.poolSize = parseInt(process.env.MONGODB_POOL_SIZE, 10);
    }

    const retryOptions = {
      retries: process.env.MONGODB_MAX_RETRIES || 10,
    };

    return new Promise((resolve, reject) => {
      promiseRetry((retry, number) => {
        if (number && number > 1) {
          logger.info('Attempt %s to connect to MongoDB - %s', number, this.url);
        }

        return client.connect(this.url, opts).catch(err => {
          logger.error('Error on attempt %s to connect', number, err);
          retry(err);
        });
      }, retryOptions).then(connection => {
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

  update(collectionName, filter, update, options={}) {
    return new Promise((resolve, reject) => {
      fixId(filter);
      this.withCollection(collectionName).then(({ conn, collection }) => {
        collection.update(filter, update, options, (err, result) => {
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

  toJSON() {
    return { url: this.url };
  }
}

module.exports = Client;
