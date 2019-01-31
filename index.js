const _ = require('lodash');
const Crawler = require("crawler");
const profiles = require('./profiles');
const allPLZS = require('./plz_sources/all_plzs.json')
const db = require('./db');
require('events').EventEmitter.prototype._maxListeners = 0;

// 1792 rechtsanwaelte
// 5062 kanzleien
const crawler = new Crawler({
	maxConnections : 1,
	retries: 20,
	userAgent: 'Mozilla/6.0',
	callback : function (error, res, done) {
		if(error){
			console.log(error,res);
		} else{
			let $ = res.$;
			let sid = $('#_sys_sid').val()
			let plz = _.last(res.request.uri.path.split('='));

			if(sid === undefined){
				console.log('no SID! ' + plz);
				db.markBadPlz(plz);
				done();
			}
			else {
				db.markGoodPlz(plz)
				console.log(plz, sid,  'https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id='+sid+'&_sort_order=Naehe&_page=1&_firstcall=true');
				profiles.fetch(sid, done);
			}
		}
	}
});
crawler.on('schedule',function(options){
	options.proxy = "http://localhost:8118";
});

db.getBad( (err,bads) => {
	db.getGood( (err,goods) => {
		let queue = _.uniq(allPLZS.map(plz => {
			return plz.substring(0,4)
		}))
		.filter(plz => {
			if(plz.length >3 && bads.indexOf(plz) === -1 && goods.indexOf(plz) === -1) return true;
		})
		.map( plz => {
			return 'https://www.anwaltsverzeichnis.de/rechtsanwalt?_citycode_search='+plz;
		})
		console.log(queue.length);
		//crawler.queue(queue)
	});
});