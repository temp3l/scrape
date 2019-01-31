const _ = require('lodash');
const Crawler = require("crawler");
const request = require('request');
const Redis = require("redis"),  redis = Redis.createClient();
const db = require('./db');
require('events').EventEmitter.prototype._maxListeners = 0;

//anwaltssuche?lss%5Bsuggest%5D=Berlin&lss%5Bsubmit%5D=

// initialize from Browser request without search params, insert PHPSESSID here!
const crawler = new Crawler({
	maxConnections : 5,
	retries: 20,
	userAgent: 'Googlebot-News',
	//headers: { "cookie": 'PHPSESSID=379b9b79a2b54548b6976b765c49681d;' },
	callback : function (error, res, done) {
		if(error){
			console.log(error,res);
		} else {
			let $ = res.$;
			let isTor = $('body').find('.content .not').text().trim();
			let ipAddress = $('body').find('strong').text().trim();
			
			console.log(isTor +' \t'+ ipAddress);
			
		}
		done();
	}
});
crawler.on('schedule',function(options){
	options.proxy = "http://localhost:8118";
});
crawler.queue([
	'https://check.torproject.org/',
	// 'https://check.torproject.org/',
	// 'https://check.torproject.org/',
	// 'https://check.torproject.org/',
	])
