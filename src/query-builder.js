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
    this.limitValue = parseInt(value, 10);
    return this;
  }

  skip(skip) {
    this.skipValue = parseInt(skip, 10);
    return this;
  }

  aggregate(aggregations) {
    this.aggregations = aggregations;
    return this;
  }

  count() {
    this.hasCount = true;
    return this;
  }

  execute() {
    return new Promise((resolve, reject) => {
      return this.client.withCollection(this.name).then(({ conn, collection }) => {
        let query;

        if (this.aggregations) {
          query = collection.aggregate(this.aggregations);
        } else {
          query = collection;
          if (this.findQuery) {
            if (this.findQuery._id) {
              try {
                this.findQuery._id = new ObjectID(this.findQuery._id);
              } catch (e) {
                console.warn(`Error converting ${this.findQuery._id} to ObjectID`);
              }
            }
            query = query.find(this.findQuery);
          }

          if (this.sortKey) {
            query = query.sort(this.sortKey);
          }

          if (this.limitValue) {
            query = query.limit(this.limitValue);
          }

          if (this.skipValue) {
            query = query.skip(this.skipValue);
          }
        }

        const method = this.hasCount ? query.count.bind(query) : query.toArray.bind(query);

        method((err, docs) => {
          if (err) { return reject(err); }
          resolve(docs);
        });
      }, reject).catch(reject);
    });
  }
}

module.exports = QueryBuilder;
