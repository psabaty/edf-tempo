const express = require('express');
const app = express();
const port = parseInt(process.env.PORT) || 8080;

//import axios from 'axios';
const axios = require('axios');
const strftime = require('strftime');
const fs = require('fs');
const { dirname } = require('path');

const CACHE_FILE_PATH = __dirname+'/var/cache/tempo.json';

/* 
app.get('/', (req, res) => {
    res.send('Bonjour !');
})
 */
app.use(express.static('public'))

app.get('/tempo/nb', (req, res) => {
    const url = "https://particulier.edf.fr/services/rest/referentiel/getNbTempoDays";
    //const url = "http://localhost:3000/";

    axios.get(url, {
        TypeAlerte: "TEMPO"
    })
    .then(response => {
        res.send(response.data);
    })
    .catch(error => {
        console.log(error);
    });
})

app.get('/tempo/current', (req, res) => {
    const url = "https://particulier.edf.fr/services/rest/referentiel/searchTempoStore";

    if ( !fs.existsSync(CACHE_FILE_PATH) ) {
        fs.mkdirSync(dirname(CACHE_FILE_PATH), {recursive:true}, (err) => {
            if (err) throw err;
          });
        fs.closeSync(fs.openSync(CACHE_FILE_PATH, 'a'));
        fs.chmodSync(CACHE_FILE_PATH, 0o777)
    }
    else {
        const cachedData = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
        console.log('(Date.now()-cachedData.queryTime) =  '+(Date.now()-cachedData.queryTime));
            
        if(true
            && cachedData.hasOwnProperty('couleurJourJ') 
            && cachedData.hasOwnProperty('couleurJourJ1') 
            && cachedData.hasOwnProperty('queryTime')
            && cachedData.couleurJourJ1 != 'NON_DEFINI' 
            && ((Date.now()-cachedData.queryTime) < 3600*24 )
            ) {

            // use cache
            console.log('Using Cache : '+JSON.stringify(cachedData));
            res.send({
                couleurJourJ: cachedData.couleurJourJ,
                couleurJourJ1: cachedData.couleurJourJ1
            });
            return;  
        }
    }
    
    // "else", query and cache
    axios.get(url,{
        params: {dateRelevant: strftime('%Y-%m-%d')}
    })
    .then(response => {
        cachableData = {
            couleurJourJ: response.data.couleurJourJ,
            couleurJourJ1: response.data.couleurJourJ1,
            queryTime: Date.now()
        }
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cachableData));
        res.send(response.data);
    })
    .catch(error => {
        console.log(error);
    });
    
})

app.listen(port, () => console.log(`App is listening on port ${port}.`));
