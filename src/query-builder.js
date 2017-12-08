const { ObjectID } = require('mongodb');
const Promise = require('bluebird');
const _ = require('lodash');

class QueryBuilder {
  constructor(name, client) {
    this.name = name;
    this.client = client;
  }

  find(query) {
    this.findQuery = _.cloneDeep(query);
    return this;
  }

  sort(key) {
    this.sortKey = _.cloneDeep(key);
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
    this.aggregations = _.cloneDeep(aggregations);
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
          const aggregations = this.aggregations;

          if (!_.isEmpty(this.findQuery)) {
            aggregations.push({ $match: this.findQuery })
          }

          if (!_.isEmpty(this.sortKey)) {
            aggregations.push({ $sort: this.sortKey });
          }

          if(this.hasCount) {
            aggregations.push({ $count: 'count' });
          } else {
            if (this.skipValue) {
              aggregations.push( { $skip: this.skipValue });
            }

            if (this.limitValue) {
              aggregations.push( { $limit: this.limitValue });
            }
          }

          query = collection.aggregate(aggregations);

          console.log('*** after aggregations', JSON.stringify(aggregations));

          return query.toArray((err, docs) => {
            if (err) { return reject(err); }
            if (this.hasCount) {
              const count = docs.length ? docs[0].count : 0;
              console.log('*** count', count);
              resolve(count);
            }
            resolve(docs);
          });
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

          const method = this.hasCount ? query.count.bind(query) : query.toArray.bind(query);

          method((err, docs) => {
            if (err) { return reject(err); }
            resolve(docs);
          });
        }
      }, reject).catch(reject);
    });
  }
}

module.exports = QueryBuilder;
