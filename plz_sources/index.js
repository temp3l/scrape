const fs = require('fs');
const _ = require('lodash');
const csvtojsonV2 = require("csvtojson/v1");

const csvFilePath = './xxx.csv' // converted from OpenGeoDB_bundesland_plz_ort_de.csv //=> ~16.000
let PLZS = require('./ww-german-postal-codes.json');	// ~8000
let ids = Object.keys(PLZS); 

const csv = require('csvtojson')
csv()
.fromFile(csvFilePath)
.then((jsonObj)=>{
	let ab = jsonObj.map(plz => plz['64754']);
	let bc = _.union(ab,ids)
	console.log(_.uniq(bc).length)
	//fs.writeFileSync('./all_plzs.json', JSON.stringify(bc));
});