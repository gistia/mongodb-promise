const GenericPool = require('generic-pool');

const getInt = (str, defaultValue) => {
  if (!str) {
    return defaultValue;
  }

  const val = parseInt(str, 10);
  if (isNaN(val)) {
    return defaultValue;
  }
  return val;
}

class ConnectionPool {
  constructor(client, {
    max=getInt(process.env.MONGODB_POOL_MAX, 10),
    min=getInt(process.env.MONGODB_POOL_MIN, 0),
  }={}) {
    this.client = client;
    this.max = max;
    this.min = min;
    this.pool = GenericPool.createPool(this, {
      max: max,
      min: max,
    });
  }

  info(oper) {
    console.log(`[${oper}]`,
      'capac:', this.pool.spareResourceCapacity,
      'avail:', this.pool.available,
      'borwd:', this.pool.borrowed,
      'pendg:', this.pool.pending,
      'size:', this.pool.size,
    );
  }

  acquire() {
    return this.pool.acquire();
  }

  release(conn) {
    return this.pool.release(conn);
  }

  create() {
    return this.client.performConnect();
  }

  destroy(conn) {
    return this.client.performClose(conn);
  }

  validate(conn) {
    return Promise.resolve(conn.serverConfig.isConnected());
  }

}
module.exports = ConnectionPool;
