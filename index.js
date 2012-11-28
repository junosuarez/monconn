var url = require('url');

var mongoConnectionString = function (o) {
	if (!(this instanceof mongoConnectionString))
		return new mongoConnectionString(o);

	if (typeof o === 'string')
		return mongoConnectionString.parse(o);

	o = o || {};

	this.ssl = o.ssl;
	this.host = o.host;
	this.port = parseInt(o.port);
	this.db = o.db;
	this.user = o.user;
	this.pass = o.pass;
};

/**
 * @param  {string|URLobj} raw
 * @return {mongoConnectionString}
 */
mongoConnectionString.parse = function (raw) {
	var cs = typeof raw === 'string' ? url.parse(raw) : raw;
	if (cs.protocol !== 'mongodb:' && cs.protocol !== 'mongodbs:') {
		throw new Error('connectionString protocol must be `mongodb:` or `mongodbs:`');
	}
	if (!cs.hostname) {
		throw new Error('connectionString must specify a hostname');
	}
	if (!cs.path) {
		throw new Error('connectionString must specify a db name in the URL path');
	}
	var username, pass;
	if (cs.auth) {
		cs.auth = cs.auth.split(':');
		username = cs.auth[0];
		pass = cs.auth[1];
	}
	var ssl = cs.protocol === 'mongodbs:';
	return mongoConnectionString({
		host: cs.hostname,
		port: parseInt(cs.port),
		db: cs.path.substr(1),
		user: username,
		pass: pass,
		ssl: ssl
	});
};

mongoConnectionString.prototype.toString = function () {
	var urlObj = {
		protocol: 'mongodb:',
		hostname: this.host,
		port: this.port,
		pathname: '/' + this.db
	};
	if (this.user && this.pass) {
		urlObj.auth = this.user + ':' + this.pass;
	}
	return url.format(urlObj);
};

/**
 * Cut through all the bs
 * @param  {mongodb}   mongodb 		 pass in an instance of the `mongodb` module
 *                                 if you wanna use it
 * @param  {object}    options     (optional)
 * @param  {Function}  cb
 * @return {varies}
 *         if server info but no db is specified,
 *           returns a mongodb.Server
 *         if server and db but no auth is specified,
 *         	 returns a mongodb.Db
 *         if server and db and auth is specified,
 *         	 returns an authenticated mongodb.Db
 */
mongoConnectionString.prototype.connect = function (mongodb, options, cb) {
	var self = this;
	if (!cb) {
		cb = options;
	}
	if (!cb || typeof cb !== 'function') {
		throw new Error('callback must be specified as the last argument');
	}
	var server = new mongodb.Server(self.host, self.port, {ssl: self.ssl});
	if (!self.db) {
		return server;
	}

	var db = new mongodb.Db(self.db, server, options);
	db.open(function (err, db) {
		if (err) return cb(err);

		if (!self.user || !self.pass) {
			cb(null, db);
		}

		db.authenticate(self.user, self.pass, function (err) {
			if (err) return cb(err);
			return cb(null, db);
		});
	});
};

module.exports = mongoConnectionString;