const Redis = require("redis"),  redis = Redis.createClient();
const _ = require('lodash');
const fs = require('fs');

//redis-cli --raw
redis.on("error", function (err) {
	console.log("Error " + err);
});

const saveDetails = (key, data) => {
	//redis.HMSET(key, data);
	//redis.lpush('db', Object.values(data).join('|'));
	let { type, plz, city, street, gebiete, tel, fax, email,  website, name, href } = data;
	redis.lpush('db', [type, plz, city, street, name, tel, fax, email, gebiete, website, href].join('|'))
}

const addProfile = (name) => {
	redis.sadd('profiles', name);
}

const markBadPlz = (plz) => {
	redis.sadd('badPLZ', plz);
}
const markGoodPlz = (plz) => {
	redis.sadd('goodPLZ', plz);
}
const getBad = (done) =>{
	redis.smembers('badPLZ', done)
}
const getGood = (done) =>{
	redis.smembers('goodPLZ', done)
}

const getProfiles = (done) => {
	redis.sdiff('profiles', 'scraped', done);
}

const markScraped = (name) => {
	redis.sadd('scraped', name);	
}

const toCSV = () => {
	fs.writeFileSync('../database_kanzlei.csv', ["type", "plz", "city", "street", "name", "tel", "fax", "email", "gebiete", "website", "href"].join('|')+'\n');
	fs.writeFileSync('../database_rechtsanwalt.csv', ["type", "plz", "city", "street", "name", "tel", "fax", "email", "gebiete", "website", "href"].join('|')+'\n');
	redis.lrange('db', 0, -1, (err, entries) => {
		entries.forEach(entry => {
			let type = entry.split('|')[0];
			let email = entry.split('|')[7];
			fs.appendFileSync('../database_'+type+'.csv', entry + '\n');	
		})
		console.log('wrote '+entries.length+' database to file: ../database.csv');
	});
}

const auskunft2CSV = () => {
	fs.writeFileSync('../database_auskunft.csv', [ "plz", "city", "phone", "email", "name", "street", "jobTitle", "special", "gebiete", "href"].join('|')+'\n');
	redis.lrange('db_auskunft', 0, -1, (err, entries) => {
		console.log('writing ' + entries.length + ' to ../database_auskunft.csv');
		entries.forEach(entry => {
			let email = entry.split('|')[3];
			fs.appendFileSync('../database_auskunft.csv', entry+'\n');
		})
	});
}
//auskunft2CSV();
//toCSV()

module.exports = {
	saveDetails,
	addProfile,
	getProfiles,
	markScraped,
	markBadPlz,
	markGoodPlz,
	getBad,
	getGood,
	auskunft2CSV,
}