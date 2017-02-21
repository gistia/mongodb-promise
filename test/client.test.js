const Client = require('../src/client');
const TestHelper = require('../src/test-helper');

describe('Client', () => {
  beforeEach((done) => {
    adapter.connect().then(db => {
      db.collection('tests').remove();
      done();
    });
  });
});