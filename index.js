const _ = require('lodash');
const Crawler = require("crawler");
const profiles = require('./profiles');
const allPLZS = require('./plz_sources/all_plzs.json')
const db = require('./db');
require('events').EventEmitter.prototype._maxListeners = 0;

// 2560 rechtsanwaelte, 7178 kanzlei'en
// 16:00 > 07:00


/*
	Webscraping for fun ist illegal...
	Webscraping for profit ist illegaler...
	Wenn man das offiziell beauftragt, könnte man das als Aufforderung zum Diebstahl/Straftat werten...

	Der Server anwaltsv***.de ist gestern 3 mal ge-crashed und musste rebooten.
		Es kamen ca. 100.000 Request innerhalb weniger Stunden per TOR-Anonymous-Proxy (also von den osterInseln, uni-havard, etc.)
		Das könnte man auch als DDOS (Distributed Denial of Service Attack) bezeichnen. /Straftat

	Einige Requests kamen aus einem privaten WLAN...(nicht meins)
		Sollte der Besitzer des WLANs eine Anzeige bekommen (wegen Diebstahl + DDOS), könnte ich helfen:

	
	Datenbank mit 9736 Kontaktdaten von Rechtsanwälten. (no-duplicates, Sample im Anhang).
		2560 Rechtsanwaelte, 7178 Kanzleien.
		Es gibt ~28000 Postleitzahlen in DE, das hätte aber zu ~3 Mio. Requests geführt - way too much!
		Statt nach den PLZs: 12055, 10256, ..., 12060 zu suchen wurden nur die ersten 4 Stellen abgefragt.
		Also 1205, 1206, 1207, => Das ergab ~8000 PLZs. Davon waren 2826 dem System (anwalts***.de) bekannt.
		Dadurch, und durch die Reboots, sollte die Datenbank zu etwa 95% vollständig sein!


	Scraper-Code
		Den Scraper sollte man nur "von privat" nutzen, in Verbindung mit TOR+Privoxy+Redis.
		Erneutes Scrapen benötigt deutlich weniger als 100.000 Requests!
		Linux + Node.js Kenntnisse sind von Vorteil.


	Lieferumfang
		Für 973,60€ gibts die fertige Datenbank als .csv und dazu den Scraper-Code mit Setup-Anleitung.
		Jegliche rechtliche Konsequenzen somit beim Hacker.

*/

const crawler = new Crawler({
	maxConnections : 1,
	retries: 20,
	userAgent: 'Mozilla/6.0',
	callback : function (error, res, done) {
		if(error){
			console.log(error,res);
		} else {
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
console.log(allPLZS.length);

db.getBad( (err,bads) => {
	db.getGood( (err,goods) => {
		let queue = _.uniq(allPLZS.map(plz => plz.substring(0,4) ))
		.filter(plz => {
			if(plz.length >3 && bads.indexOf(plz) === -1 && goods.indexOf(plz) === -1) return true;
		})
		.map( plz => {
			return 'https://www.anwaltsverzeichnis.de/rechtsanwalt?_citycode_search='+plz;
		})
		console.log(queue.length);
		crawler.queue(queue)
	});
});