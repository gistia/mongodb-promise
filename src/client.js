const Promise = require('bluebird');
const promiseRetry = require('promise-retry');

const QueryBuilder = require('./query-builder');
const { fixId } = require('./utils');
const connectionHandler = require('./connection-handler')

class Client {
  constructor(url) {
    this.url = url || process.env.MONGODB_URL;
  }

  static bootstrap(url) {
    Client.instance = new Client(url);
    return Client.instance.init();
  }

  static get() {
    if (!Client.instance) {
      throw new Error('Connection pool is not initialized! please, use Client.boostrap()');
    }

    return Client.instance;
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

        return connectionHandler.retrieve_connection(this.url, opts).catch(err => {
          logger.error('Error on attempt %s to connect', number, err);
          connectionHandler.discard_connection();
          retry(err);
        });
      }, retryOptions).then(connection => {
        logger.debug('Connection Pool is created');
        this.connection = connection;
        this.connection.on('close', this.connectionClosed.bind(this));
        resolve(connection);
      }).catch(reject);
    });
  }

  connectionClosed() {
    this.connection = null;
    connectionHandler.discard_connection();
  }

  connect() {
    if (!this.connection) {
      return this.init();
    }

    return new Promise((resolve, reject) => {
      this.connection.command({ ping: 1 }, (err) => {
        if (err) {
          logger.info('reconnecting after ping failed with error - %s', err, err);
          return this.init().then(conn => resolve(conn)).catch(err => reject(err));
        }
        resolve(this.connection);
      });
    });
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

  mapReduce(collectionName, map, reduce, filter, collectionOut) {
    return new Promise((resolve, reject) => {
      this.withCollection(collectionName).then(({ conn, collection }) => {
        collection.mapReduce(map, reduce, { query: filter, out: collectionOut }, (err, result) => {
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
