const _ = require('lodash');
const Crawler = require("crawler");
const db = require('./db');

const c = new Crawler({
    maxConnections : 20,
    userAgent: 'SeaMonkey/2.7.1',
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            let rName = _.last(res.request.uri.path.split('/'))
            let href = res.request.uri.href;
            let type = res.request.path.split('/')[2];
            //return console.log(res.request.uri)
            let $ = res.$;
            let main =  $('body')
            let fields = main.find('div.fields');
            let gebiete = fields.text().trim().replace('Von mir vertretene Rechtsgebiete','').replace('Von uns vertretene Rechtsgebiete','');
            let street = main.find('div.Kontakt-Adresse').contents().eq(0).text().trim();
            let address = main.find('div.Kontakt-Adresse').contents().eq(2).text().trim();
            let name = $('h1').text().trim();
            let plz = address.split(' ')[0];
            let city = address.split(' ')[1];

            let labels = main.find('.Kontakt-Adressen-Zusätze-Label');
            let priv = main.find('.Kontakt-Adressen-Zusätze-Content');

            let sLabels = [];
            labels.find('div').each( function(){
                sLabels.push($(this).text());
            });
            console.log(sLabels);

            let tels = [], faxs = [], emails = [], websites = [], idx = 1;

            for (let i=0; i<sLabels.length; i++){
                if(sLabels[i] === 'Telefon:') tels.push( priv.contents().eq(idx).text().trim() );
                if(sLabels[i] === 'Fax:') faxs.push( priv.contents().eq(idx).text().trim() );
                if(sLabels[i] === 'E-Mail:') emails.push( priv.contents().eq(idx).text().trim() );
                if(sLabels[i] === 'Homepage:') websites.push( priv.contents().eq(idx).text().trim() );
                idx += 2;
            }

            // let tel = priv.contents().eq(1).text().trim();
            // let fax = priv.contents().eq(3).text().trim();
            // let email = priv.contents().eq(5).text().trim();
            // let website = priv.contents().eq(7).text().trim();

            let result = { type, plz, city, street, gebiete, 
                tel: tels.join(', '), 
                fax: faxs.join(', '), 
                email: emails.join(', '),  
                website: websites.join(', '), 
                name, 
                href,  }
                db.saveDetails(rName, result)
                db.markScraped(res.request.uri.path)
                console.log( result );
            }
            done();
        }
    });
c.on('schedule',function(options){
    options.proxy = "http://localhost:8118";
});
// Queue just one URL, with default callback
//c.queue('http://www.amazon.com');
//c.queue(['https://www.anwaltsverzeichnis.de/rechtsanwaelte/rechtsanwalt/rainer_sebel_berlin']);

const scrapeIT = (profiles) => {
    let queue = profiles.map( name => 'https://www.anwaltsverzeichnis.de'+name );
    c.queue(queue);
    c.on('drain',function(){
        console.log('drained all profiles from sadd');
    });
}


db.getProfiles( (err, data) =>{
  scrapeIT( data );
})


//https://www.anwaltsverzeichnis.de/rechtsanwaelte/kanzlei/rechtsanwalt/hartwig_meyer_berlin
//https://www.anwaltsverzeichnis.de/rechtsanwaelte/rechtsanwalt/hartwig_meyer_berlin

