import redis from 'redis';

module.exports = (config) => {
  config = config || {};
  config.namespace = config.namespace || 'gitbot:store';

  let storage = {},
    client = redis.createClient(config),
    methods = config.methods || ['teams', 'users', 'channels'];

  // Implements required API methods
  for (var i = 0; i < methods.length; i++) {
    const hash = methods[i];
    storage[methods[i]] = {
      get: (id, cb) => {
        client.hget(`${config.namespace}:${hash}`, id, (err, res) => {
          cb(err, JSON.parse(res));
        });
      },
      save: (object,cb) => {
        if (!object.id) // Silently catch this error?
          return cb(new Error('The given object must have an id property'), {});

        client.hset(`${config.namespace}:${hash}`, object.id, JSON.stringify(object), cb);
      },
      all: (cb) => {
        client.hgetall(`${config.namespace}:${hash}`, (err, res) => {
          if (err)
            return cb(err, {});

          if (null === res)
            return cb(err, res);

          for (var i in res)
            res[i] = JSON.parse(res[i]);

          cb(err, res);
        });
      }
    };
  }

  return storage;
};
