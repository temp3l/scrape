const _ = require('lodash');
const Crawler = require("crawler");
const request = require('request');
const Redis = require("redis"),  redis = Redis.createClient();
const db = require('./db');
require('events').EventEmitter.prototype._maxListeners = 0;

//***ssuche?lss%5Bsuggest%5D=Berlin&lss%5Bsubmit%5D=

// initialize from Browser request without search params, insert PHPSESSID here!
const crawler = new Crawler({
	maxConnections: 10,
	retryTimeout: 30000,
	timeout: 30000,
	retries: 20,
	userAgent: 'Googlebot-News',
	headers: { "cookie": 'PHPSESSID=379b9b79a2b54548b6976b765c49681d;' },
	callback : function (error, res, done) {
		if(error){
			console.log(error,res);
		} else {
			let $ = res.$;
			let lawyers = $('body').find('.lawyer.lawyer-list')
			lawyers.each(function(){
				let name = $(this).find('.h4.name').text().trim();
				let jobTitle = $(this).find('.job-title').text().trim();
				let street = $(this).find('address').contents().eq(0).text().trim();
				let address = $(this).find('address').contents().eq(2).text().trim();
				let plz = address.split(' ')[0];
				let city = address.replace(plz, '').trim();
				let email = $(this).find('span.email').text().trim();
				let phone = $(this).find('span.phone').text().trim();
				let href = $(this).find('a').attr('href')

				let special = $(this).find('.lawyer-professional-advocacies .badge.badge-blue');
				let gebiete = $(this).find('.lawyer-sections span.badge.badge-default');
				let sections = [], specials = [];

				gebiete.each(function(){ sections.push( $(this).text() ) });
				special.each(function(){ specials.push( $(this).text() ) });
				let result = {
					name, 
					jobTitle, 
					street,
					plz, 
					city,
					special: specials.join(', '),
					gebiete: sections.join(', '),
					email, 
					phone,
					href: 'https://***.de/'+href,
				};
				
				saveAuskunft(result);
			});
			console.log(res.request.uri.search.split('=')[1], ' added: ' + lawyers.length );
			done()
		}
	}
});
crawler.on('schedule',function(options){
	options.proxy = "http://localhost:8118";
});
//crawler.queue('https://***.de/***ssuche?page=1')

let queue = [];
for (let i=1; i<3700; i++){ // 6178
	queue.push('https://***.de/***ssuche?page='+i);	
}
crawler.queue(queue);


const saveAuskunft = (data, next) => {
	let { name, jobTitle, street, plz, city, special, gebiete, email, phone, href } = data;
	redis.sismember('auskunft_mails', email, (err, exists) => {
		if(exists === 0){
			redis.lpush('db_auskunft', [ plz, city, phone, email, name, street, jobTitle, special, gebiete, href ].join('|'));
			if(email !== '') redis.sadd('auskunft_mails', email);
		}
	});
}

crawler.on('drain', () =>{
	setTimeout( () => {
		console.log('all drained, writing csv');
		db.auskunft2CSV()
	},1000)
	
})