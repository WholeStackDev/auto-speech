import {playAudioFile} from 'audic';
import sdk from 'microsoft-cognitiveservices-speech-sdk';
import clipboard from 'clipboardy';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import crypto from 'crypto';
import * as fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4} from 'uuid';


(async function() {

    const argv = yargs(hideBin(process.argv)).argv
    if(!argv.lang) argv.lang = 'en';
    var text = clipboard.readSync();
    var speechKey = "82584b84babd42f88081d23819d5803c";
    var translatorKey = "ef6d5407b548409eaffcd1b606fac84b";
    var hash;
    var containsEnglish;
    var containsPersian;
    var fromLang;
    var toLang;
    var needsTranslation;

    if(text.length > 500) {
        text = "Sorry, you can't speak more than 500 letters at a time. Try again with a smaller selection."
    }

    const englishLetters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',]
    const persianLetters = ['ض','ص','ث','ق','ف','غ','ع','ه','خ','ح','ج','چ','ش','س','ی','ب','ل','ا','ت','ن','م','ک','گ','ظ','ط','ز','ر','ذ','د','پ','و']
    
    containsEnglish = englishLetters.some(x => text.includes(x));
    containsPersian = persianLetters.some(x => text.includes(x));

    if(containsEnglish && containsPersian) {
        text = "Sorry, your selection cannot contain both English and Persian";
        containsPersian = false;
    }

    if(containsEnglish && argv.lang === 'en') needsTranslation = false;
    if(containsPersian && argv.lang === 'fa') needsTranslation = false;
    if(containsEnglish && argv.lang === 'fa') {
        needsTranslation = true;
        fromLang = 'en';
        toLang = 'fa';
    }
    if(containsPersian && argv.lang === 'en') {
        needsTranslation = true;
        fromLang = 'fa';
        toLang = 'en';
    }

    hash = crypto.createHash('md5').update(`${argv.lang}${text}`).digest("hex");  
    
    const audioDirectory = fs.readdirSync("./audio");
    const found = audioDirectory.includes(`${hash}.wav`);
    if(found) {
        playAudioFile(`./audio/${hash}.wav`);
    } else {
        if(!needsTranslation) {
            getFileFromAzure();
        } else {
            translateWithAzure();
        }
    }

    function getFileFromAzure() {
        var region = "eastus2";
        var audioFile = `./audio/${hash}.wav`;
        const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, region);
        const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);
        speechConfig.speechSynthesisVoiceName = argv.lang === "fa" ? "fa-IR-FaridNeural" : "en-US-GuyNeural"; 
        var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        synthesizer.speakTextAsync(text, () => {
            playAudioFile(audioFile);
            synthesizer.close();
            synthesizer = null;
        },
        () => {
            synthesizer.close();
            synthesizer = null;
        })
    };

    function translateWithAzure() {
        axios({
            baseURL: "https://api.cognitive.microsofttranslator.com",
            url: '/translate',
            method: 'post',
            headers: {
                'Ocp-Apim-Subscription-Key': translatorKey,
                'Ocp-Apim-Subscription-Region': 'eastus2',
                'Content-type': 'application/json',
                'X-ClientTraceId': uuidv4().toString()
            },
            params: {
                'api-version': '3.0',
                'from': fromLang,
                'to': toLang
            },
            data: [{
                'text': text
            }],
            responseType: 'json'
        }).then(function(response){
            console.log(JSON.stringify(response.data, null, 4));
            text = response.data[0].translations[0].text;
            getFileFromAzure();
        }).catch(error => {
            console.log(error)
        })
    }
}());