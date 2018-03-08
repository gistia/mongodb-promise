const client = require('mongodb').MongoClient;

class ConnectionHandler {

    retrieve_connection(url, opts) {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = client.connect(url, opts);
        return this.connectionPromise;
    }

    discard_connection() {
        this.connectionPromise = null;
    }
}

const connectionHandler = new ConnectionHandler();
module.exports = connectionHandler;
