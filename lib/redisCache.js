var _     = require('lodash');
var Q     = require('q');
var Redis = require('redback');

/**
 * RedisCache Contstructor
 * @param Object config Redis configuration
 */
function RedisCache(config) {
  this.name = 'RedisCache';

  /* Setup the config by merging
   * with the defaults
   */
  this.config = _.merge({
    port : 6379,
    host : '127.0.0.1',
    auth : null,
    opts : {
      namespace : ''
    }
  }, config);

  /* Create an redis connection
   * with the config passed
   */
  this.instance = new Redis.createClient(
    this.config.port,
    this.config.host,
    this.config.opts
  );

  /* Create a new Cache instance
   * with the namespace in config
   */
  this.cache = this.instance.createCache(
    this.config.opts.namespace
  );

  /* If we've been passed an auth-password,
   * tell the client to use it for requests
   */
  if (this.config.auth) {
    this.instance.client.auth(this.config.auth, function(err) {
      throw err;
    });
  }
};

/**
 * Set
 * @param String  key     Key to store item as
 * @param Any     value   Value to store
 * @param Integer expires How long until it expires?
 * @return Promise
 */
RedisCache.prototype.set = function(key, value, expires) {
  var deferred = Q.defer();

  /* If we're passing an object, then
   * make it in to JSON. Otherwise it
   * won't go in Redis
   */
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }

  /* If we haven't been passed an expire amount, then
   * pass the callback as the function.
   */
  if (!expires) {
    this.cache.set(key, value, callback);
  } else {
    this.cache.set(key, value, (expires / 1000), callback);
  }

  /* Callback
   */
  function callback(err) {
    if (!err) {
      deferred.resolve();
    } else {
      deferred.reject(err);
    }
  }

  return deferred.promise;
};

/**
 * Get
 * @param  String key Key of item to retrieve
 * @return Promise
 */
RedisCache.prototype.get = function(key) {
  var deferred = Q.defer();

  this.cache.get(key, function(err, value) {
    if (err) {
      deferred.reject(err);
    } else {

      try {
        value = JSON.parse(value);
      } catch (e) {
      } finally {
        deferred.resolve(value);
      }
    }
  });

  return deferred.promise;
};

/**
 * Delete
 * @param  String key Key of item to rdelete
 * @return Promise
 */
RedisCache.prototype.del = function(key) {
  var deferred = Q.defer();

  this.cache.flush(key, function(err) {
    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve();
    }
  });

  return deferred.promise;
}

module.exports = RedisCache;