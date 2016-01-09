var Twitter = require('twit'),
    log,
    client;

var tweet = function tweet_func (status) {
    'use strict';
    var data = { status: status };
    client.post('statuses/update', data, function(err, data, response) {
      if (err) {
        return log.error('error tweeting', data);
      }
      log.info('tweeted', data);
    });
};

module.exports = function (cfg) {
    client = new Twitter({
        consumer_key: cfg.twt_c_k,
        consumer_secret: cfg.twt_c_s,
        access_token: cfg.twt_a_t_k,
        access_token_secret: cfg.twt_a_t_s
    });
    log = require('./logger.js')(cfg, 'tweets');
    return tweet;
};
