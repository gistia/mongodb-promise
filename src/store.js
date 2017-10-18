class Store {
  constructor(client, collection) {
    this.client = client;
    this.collection = collection;
  }

  save(json) {
    return this.client.insert(this.collection, json).then((res) => {
      return Promise.resolve(res.ops[0]);
    });
  }

  update(id, json) {
    return this.client.update(this.collection, { _id: id }, { $set: json });
  }

  aggregateWithPagination(aggregations, pagination) {
    return new Promise((resolve, reject) => {
      const resultPipe = pagination ? aggregations.concat({
        $skip: pagination.offset }, { $limit: pagination.limit }) : aggregations;
      const countPipe = aggregations.concat({ $count: 'count' });

      Promise.all([resultPipe, countPipe].map(pipe => this
        .client
        .query(this.collection)
        .aggregate(pipe)
        .execute())).then(([rows, countRes]) => {
          const count = countRes.length ? countRes[0].count : 0;
          resolve({ rows, count });
        }, reject).catch(reject);
    });
  }

  find(filter) {
    return this
      .client
      .query(this.collection)
      .find(filter)
      .execute();
  }

  findOne(filter) {
    return this
      .client
      .query(this.collection)
      .find(filter)
      .execute()
      .then((res) => Promise.resolve(res[0]));
  }

  findById(id) {
    return this
      .client
      .query(this.collection)
      .find({ _id: id })
      .execute()
      .then((res) => Promise.resolve(res[0]));
  }

  remove(filter) {
    return this
      .client
      .remove(this.collection, filter);
  }
}

module.exports = Store;
