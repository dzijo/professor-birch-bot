const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

function httpGetAsync(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            console.log(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.setRequestHeader("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36");
    //xmlHttp.setRequestHeader("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9");
    //xmlHttp.setRequestHeader("path", "/battle-gen8unratedrandombattle-1037765150");
    //xmlHttp.setRequestHeader("authority", "play.pokemonshowdown.com");
    //xmlHttp.setRequestHeader("accept-encoding", "gzip, deflate, br");


    xmlHttp.send(null);
}

httpGetAsync(`https://play.pokemonshowdown.com/battle-gen8unratedrandombattle-1037765150`);