const _ = require('lodash');
const axios = require('axios');
const cheerio = require('cheerio');
const profiles = require('./profiles');
const allPLZS = require('./plz_sources/all_plzs.json')


const getSession = (plz) => {
	const uri = 'https://www.anwaltsverzeichnis.de/rechtsanwalt?_citycode_search='+plz;
	axios.post(uri).then(function (response) {
		let $ = cheerio.load(response.data);
		let sid = $('#_sys_sid').val();
		console.log(plz, sid);
		if(sid === undefined){
			console.log('no sid for ' + plz)
		}else{
			console.log( sid,  'https://www.anwaltsverzeichnis.de/web/get_more_hits.aspx?_session_id='+sid+'&_sort_order=Naehe&_page=1&_firstcall=true');
			profiles.fetch(sid, console.log);
		}
	})
	.catch(function (error) {
		console.log(error);
	});
}

//getSession(1205);
//getSession(1031);

let all = _.uniq(allPLZS.map(plz => {
	return plz.substring(0,4)
}))
.filter(plz=>{
	if(plz.length >3 && plz.substring(0,3) == 120) return true;
})
.forEach(plz=>{
	//console.log(plz);
	
	//getSession(plz);
})


