"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var request = require("request");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);



// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'api.projectoxford.ai';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })

//NULL INTENT
.matches('None', (session, args) => {
    session.send('Hi! This is the None intent handler. You said: \'%s\'.', session.message.text);
})

//WEATHER + CITY THIS IS TEMPORARY
.matches('weather', (session, args) => {
    var city = builder.EntityRecognizer.findEntity(args.entities, 'builtin.geography.city');
    var country = builder.EntityRecognizer.findEntity(args.entities, 'builtin.geography.country');

    if (country != null)
        session.send('You asked about the weather in %s.', country.entity);
    else if (city != null)
        session.send('You asked about the weather in %s.', city.entity);
    else
        session.send('You asked about the weather');
    
})

//MOVIE + GENRE
.matches('movie', (session, args) => {
	var genre = builder.EntityRecognizer.findEntity(args.entities, 'genre');

	if (genre != null)
    	session.send('You asked about movies in %s.', genre.entity);
    else
		session.send('You asked about movies');    	

})

//RESTAURANT + CUISINE + COST
.matches('restaurant', (session, args) => {
	var cuisine = builder.EntityRecognizer.findEntity(args.entities, 'cuisine');
	var cost = builder.EntityRecognizer.findEntity(args.entities, 'cost');

	if (cuisine != null && cost != null)
	    session.send('You asked about %s %s restaurants', cost.entity, cuisine.entity);
	else if (cuisine != null)
		session.send('You asked about %s restaurants', cuisine.entity);
	else if (cost != null)
		session.send('You asked about %s restaurants', cost.entity);
    else
    	session.send('You asked about restaurants');
})

//GREETING
.matches('greeting', (session, args) => {

    var geoLat = "45.4951999";
    var geoLong = "-73.5810253";

    var myJSONObject = {
        "search": [{
            "summary": true,
            "where": { "type": "GEO", "value": location },
            "collection": "MERCHANT",
            "language": "EN",
            "context": "CONTENT-R",
            "results": [{ "type": "ROOT", "from": 0, "count": 3 }]
        }]
    };

    request({
        url: "http://hackaton.ypcloud.io/search",
        method: "POST",
        json: true,
        body: myJSONObject
    }, function (error, response, body) {
        for (var x = 0; x < response.body.searchResult[0].merchants.length; x++)
            session.send(JSON.stringify(response.body.searchResult[0].merchants[0]).businessName);
    });

    session.send('Hello');
})

//DEFAULT
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    


if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

