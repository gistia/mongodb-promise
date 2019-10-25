const mongoClient = require('mongodb').MongoClient;
const Promise = require('bluebird');
const promiseRetry = require('promise-retry');
const _ = require('lodash');

const QueryBuilder = require('./query-builder');
const { fixId } = require('./utils');

class Client {
  constructor(url, opts = {}) {
    this.url = url || process.env.MONGODB_URL;
    this.opts = Object.assign({ retries: 10, useUnifiedTopology: false }, opts);
  }

  init() {
    if (process.env.MONGODB_POOL_SIZE) {
      this.opts.poolSize = parseInt(process.env.MONGODB_POOL_SIZE, 10);
    }

    const retryOptions = {
      retries: process.env.MONGODB_MAX_RETRIES || this.opts.retries,
    };

    return promiseRetry((retry, number) => {
      if (number && number > 1) {
        logger.info('Attempt %s to connect to MongoDB - %s', number, this.url);
      }

      return mongoClient
        .connect(
          this.url,
          _.omit(this.opts, ['retries'])
        )
        .catch((err) => {
          logger.error('Error on attempt %s to connect', number, err);
          retry(err);
        });
    }, retryOptions).then((conClient) => {
      this.client = conClient;
      this.connection = conClient.db();
      this.connection.on('close', this.connectionClosed.bind(this));
      return this.connection;
    });
  }

  connectionClosed() {
    this.connection = null;
  }

  disconnect() {
    this.client && this.client.close();
  }

  connect() {
    return Promise.try(() => (this.connection ? this.connection : this.init()));
  }

  collection(conn, name) {
    return Promise.try(() => conn.collection(name));
  }

  query(collection) {
    return new QueryBuilder(collection, this);
  }

  withCollection(name) {
    return this.connect().then((conn) => this.collection(conn, name)).then((collection) => ({ collection }));
  }

  update(collectionName, filter, update, options = {}) {
    return this.withCollection(collectionName).then(({ collection }) => collection.update(fixId(filter), update, options));
  }

  findOneAndUpdate(collectionName, query, doc, options = {}) {
    return this.withCollection(collectionName).then(({ collection }) => collection.findOneAndUpdate(query, doc, options));
  }

  insertMany(collectionName, docs) {
    return this.withCollection(collectionName).then(({ collection }) => collection.insertMany(docs));
  }

  insert(collectionName, doc) {
    return this.withCollection(collectionName).then(({ collection }) => collection.insertOne(doc));
  }

  remove(collectionName, filter) {
    return this.withCollection(collectionName).then(({ collection }) => collection.deleteMany(filter));
  }

  mapReduce(collectionName, map, reduce, filter, collectionOut) {
    return this.withCollection(collectionName).then(({ collection }) =>
      collection.mapReduce(map, reduce, { query: filter, out: collectionOut })
    );
  }

  toJSON() {
    return { url: this.url };
  }
}

module.exports = Client;
