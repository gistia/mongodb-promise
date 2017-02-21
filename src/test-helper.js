const Promise = require('es6-promise').Promise;
const Client = require('./client.js');

const client = new Client();

class TestHelper {
  setupData(data) {
    return new Promise((resolve, reject) => {
      this.connect().then(collection => {
        collection.insertMany(data, (err, doc) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(doc);
        });
      });
    });
  }

  retrieveData() {
    return new Promise((resolve, reject) => {
      this.connect().then(collection => {
        collection.find({}).toArray((err, docs) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(docs);
        });
      });
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      client.connect().then(db => {
        resolve(db.collection('tests'));
      }, reject);
    });
  }

  eraseCollection() {
    return new Promise((resolve, reject) => {
      client.connect().then(db => {
        db.collection('tests').remove();
        resolve();
      }, reject).catch(reject);
    });
  }
}

module.exports = TestHelper;
