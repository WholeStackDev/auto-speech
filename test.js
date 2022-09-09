import {playAudioFile} from 'audic';
(async () => {
    
    try {
        await playAudioFile('YourAudioFile.wav');

        console.log("done");
    } catch (error) {
        console.error(error);
    }
})();