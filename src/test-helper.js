const { ObjectID } = require('mongodb');
const Client = require('./client');
const traverse = require('traverse');
const Promise = require('bluebird');

class TestHelper {
  constructor(collectionName, mongoUrl) {
    this.collectionName = collectionName || 'tests';
    this.client = new Client(mongoUrl);
  }

  init() {
    return this.client.init();
  }

  setupData(data) {
    data = data.map(doc => {
      traverse(doc).forEach(function(val) {
        if (this.key === '_id'  && val.length === 12) {
          this.update(ObjectID(val));
        }
      });
      return doc;
    })

    return new Promise((resolve, reject) => {
      this.init().then(_ => {
        this.client.withCollection(this.collectionName).then((collection) => {
          collection.insert(data, (err, doc) => {
            if (err) { return reject(err); }
            resolve(doc);
          });
        }).catch(reject);
      }).catch(reject);
    });
  }

  retrieveData() {
    return new Promise((resolve, reject) => {
      this.client.init().then(_ => {
        this.client.withCollection(this.collectionName).then((collection) => {
          collection.find({}).toArray((err, docs) => {
            if (err) { return reject(err); }
            resolve(docs);
          });
        }, reject).catch(reject);
      });
    });
  }

  eraseCollection() {
    return new Promise((resolve, reject) => {
      this.client.init().then(db => {
        db.collection(this.collectionName).deleteMany().then(_ => {
          this.client.disconnect();
          resolve();
        });
      }).catch(reject);
    });
  }

  eraseData(data=[]) {
    return new Promise((resolve, reject) => {
      this.client.init().then(db => {
        db.collection(this.collectionName).deleteMany({ _id: { $in: data.map(_ => _._id) }}, () => {
          this.client.disconnect();
          resolve();
        }, reject)
      }, reject).catch(reject);;
    });
  }
}

module.exports = TestHelper;
