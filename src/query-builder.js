const { Promise } = require('es6-promise');
const { ObjectID } = require('mongodb');

class QueryBuilder {
  constructor(name, client) {
    this.name = name;
    this.client = client;
  }

  find(query) {
    this.findQuery = query;
    return this;
  }

  sort(key) {
    this.sortKey = key;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  execute() {
    return new Promise((resolve, reject) => {
      this.client.collection(this.name).then(collection => {
        let query = collection;

        if (this.findQuery) {
          if (this.findQuery._id) {
            this.findQuery._id = new ObjectID(this.findQuery._id);
          }
          query = query.find(this.findQuery);
        }

        if (this.sortKey) {
          query = query.sort(this.sortKey);
        }

        if (this.limitValue) {
          query = query.limit(this.limitValue);
        }

        query.toArray((err, docs) => {
          if (err) { return reject(err); }
          resolve(docs);
        });
      });
    });
  }
}

module.exports = QueryBuilder;
