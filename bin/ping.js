#!/usr/bin/env node
const { Client } = require('../src/index');

global.logger = {
  debug: console.log,
  info: console.log,
  warn: console.log,
  error: console.error,
};

const ping = (conn) => {
  return new Promise((resolve, reject) => {
    const start = new Date().getTime();
    conn.command({ ping: 1 }, (err) => {
      if (err) { return reject(err); }
      const elapsed = new Date().getTime() - start;
      // console.log('Took', elapsed, 'ms');
      resolve(elapsed);
    });
  });
};

const attempts = process.argv.length > 2 ? process.argv[2] : 100;
const client = new Client();
client.init().then(conn => {
  const promises = Promise.all([...Array(attempts)].map((_val, _idx) => ping(conn)));
  promises.then(res => {
    console.log('finished', attempts, 'attempts');
    const total = res.reduce((time, res) => time += res, 0);
    console.log('total', total, 'ms');
    console.log('avg', total / res.length, 'ms');
  }).then(_ => {
    conn.close();
  });
});
