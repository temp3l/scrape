const _ = require('lodash');
const Crawler = require("crawler");
const db = require('./db');
// 12055 c1523e6f-db6c-4d26-9e25-3f357b7850d4
// 1205 1d622c2f-11a0-48be-bc1d-7fc8a8ab833f

const crawler2 = new Crawler({
	maxConnections : 20,
	retries: 20,
	userAgent: 'Mozilla/6.2',
	callback : function (error, res, done) {
		if(error){
			console.log(error,res);
		} else{
			let $ = res.$;
			let rows = $("table.full tbody tr td:nth-child(1)").find('a'); // tr td:nth-child(2)
			//console.log(rows.length);
			rows.each(function(){
				let href = $(this).attr('href');
				let name = _.last(href.split('/'));
				let type = href.split('/')[2]
				db.addProfile(href);
			});
		}
		done();
	}
});
crawler2.on('schedule',function(options){
	options.proxy = "http://localhost:8118";
});
const getMoreUrls = (sid) => {
	//https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id=4c1df32b-7268-4278-8f96-84e8548798fa&_sort_order=-&_page=1&_firstcall=true
	return [
	'https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id='+sid+'&_sort_order=Naehe&_page=1&_firstcall=true',
	'https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id='+sid+'&_sort_order=Naehe&_page=2&_firstcall=true',
	'https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id='+sid+'&_sort_order=Naehe&_page=3&_firstcall=true',
	'https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id='+sid+'&_sort_order=Naehe&_page=4&_firstcall=true',
	'https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id='+sid+'&_sort_order=Naehe&_page=5&_firstcall=true',
	'https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id='+sid+'&_sort_order=Naehe&_page=6&_firstcall=true',
	'https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id='+sid+'&_sort_order=Naehe&_page=7&_firstcall=true',
	]
}

// crawler.on('drain',function(){
// 	console.log(profileUrls.length);
// });

// let urls = getMoreUrls('1d622c2f-11a0-48be-bc1d-7fc8a8ab833f');
// crawler.queue( urls );


module.exports = {
	fetch: (sid, done) => {
		crawler2.queue( getMoreUrls(sid) );
		crawler2.on('drain', () => {
			console.log('done');
			done();
		});
	}
}