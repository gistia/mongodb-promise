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

    return this.init()
      .then(() => this.client.withCollection(this.collectionName))
      .then(({ collection }) => collection.insert(data));
  }

  retrieveData() {
    return this.init()
      .then(() => this.client.withCollection(this.collectionName))
      .then(({ collection }) => collection.find({}).toArray());
  }

  eraseCollection() {
    return this.init()
      .then((db) => db.collection(this.collectionName).deleteMany())
      .then(() => this.client.disconnect());
  }

  eraseData(data=[]) {
    return this.init()
      .then((db) => db.collection(this.collectionName).deleteMany({ _id: { $in: data.map(_ => _._id) } }))
      .then(() => this.client.disconnect());
  }
}

module.exports = TestHelper;
