const mongo = require('mongodb');
const config = require('../config/config');
const error = require('../helpers/error');
const log = require('../helpers/log');
const Order = require('../helpers/Order');
const debug = require('debug')('db');

class Db {
  static connect() {
    const MongoClient = new mongo.MongoClient();
    return new Promise((resolve, reject) => {
      MongoClient.connect(config.db.url, (connectionErr, newDb) => {
        if (connectionErr) {
          error('DB', 'Connection could not be established', connectionErr);
          reject(connectionErr);
        } else {
          global.db = newDb;
          log(`⚙  [DB.connect]         Success connecting to DB ${config.db.url}`);
          resolve('success');
        }
      });
    });
  }

  static createOrUpdate(collection, data) {
    return new Promise((resolve, reject) => {
      const query = {
        name: data.name,
        level: data.level,
        parent: data.parent,
      };
      const options = {
        upsert: true,
        returnNewDocument: true,
      };

      global.db.collection(collection).findOneAndUpdate(query, data, options)
        .then((result) => {
          debug(result);
          resolve(result);
        })
        .catch((err) => {
          error('DB', 'error inserting data', err);
          reject(err);
        });
    });
  }

  static find(collection, filter, id = false) {
    return new Promise((resolve, reject) => {
      const idObj = id ? new mongo.ObjectID(id) : {};
      global.db.collection(collection)
        .find(idObj, filter)
        .toArray()
        .then((result) => {
          debug(result);
          if (result.length === 1) {
            resolve(result[0]);
          } else {
            resolve(result.sort(Order.portuguese));
          }
        })
        .catch((err) => {
          error(err);
          reject(err);
        });
    });
  }
}

module.exports = Db;
