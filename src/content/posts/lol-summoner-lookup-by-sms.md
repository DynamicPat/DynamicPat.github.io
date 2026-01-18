---
title: "LoL Summoner Lookup by SMS"
summary: "Building an SMS bot with Twilio and the Riot Games API to look up League of Legends summoner stats."
tags: ["tutorial", "twilio", "api", "gaming"]
date: "2020-09-12"
---

<blockquote>
  <p>Originally published on <a href="https://dev.to/patrickb2me/lol-summoner-lookup-by-sms-pl2" target="_blank" rel="noopener">DEV Community</a></p>
</blockquote>

<p>I enjoy the occasional game of League of Legends.</p>

<p>As such, I've often thought about playing with the Riot Games API to create something fun and interesting. I eventually settled on this very simple SMS bot that accepts a summoner name via Text, and returns information about that summoner. It's a great beginner project if you're trying to learn the basics of:</p>

<ul>
  <li>Twilio programmable SMS</li>
  <li>Twilio functions</li>
  <li>Node / Javascript</li>
  <li>Riot Games API usage</li>
</ul>

<p>Without further ado, let's begin!</p>

<h2>Riot Games API Key</h2>

<p>First, let's get set up with a Riot Games API key. <a href="https://developer.riotgames.com/docs/portal" target="_blank" rel="noopener">Here's</a> how to get started with Riot's Developer Portal, for this project you can use the temporary key to test and develop until your application is approved.</p>

<p>Hold on to that key, and now we'll move over to Twilio, which will power our SMS and lookup logic.</p>

<h2>Twilio Function</h2>

<p>We're going to use a Twilio Function to power the logic behind our SMS bot, so lets work on that first.</p>

<p>If you haven't set up a Twilio account before, you can use my referral link <a href="https://www.twilio.com/referral/y3FmFb" target="_blank" rel="noopener">here</a>! (<a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener">Non referral link</a>)</p>

<p>Either create a new service, or use an existing one under Twilio functions (if you're not sure, just create a new one for now).</p>

<p>Once your service is ready, we'll create a few environment variables. Specifically:</p>

<ul>
  <li><strong>Riot_Base_Url</strong>: Use this to store the base url for our Riot Requests. This will be determined by the region you want to lookup summoners against. For North America (NA1), this would be <code>https://na1.api.riotgames.com</code>.</li>
  <li><strong>Riot_Api_Key</strong>: Use this to store the API key you received from Riot Games.</li>
  <li><strong>Riot_Champion_Pool_Url</strong>: Use this to store the <a href="https://riot-api-libraries.readthedocs.io/en/latest/ddragon.html" target="_blank" rel="noopener">Data Dragon</a> url from Riot. We use this to retrieve static champion information.</li>
</ul>

<p>Nicely done! One last thing before we get to the code! Go to the dependencies section of your function service, and add <code>axios</code> version 0.20.0 as a dependency.</p>

<p>On to the code! Using the Add button, create a new blank function in your service (name it however you please). Paste in the following code chunk:</p>

```javascript
const axios = require('axios');

exports.handler = function(context, event, callback) {
  /* Assemble vars */
  const { Body } = event;
  const summonerName = Body;
  const championPoolUrl = context.Riot_Champion_Pool_Url;
  const summonerGetUrl = context.Riot_Base_Url + '/lol/summoner/v4/summoners/by-name/' + summonerName + "?api_key=" + context.Riot_Api_Key;

  /* Set up inital axios HTTP promises */
  // Retrieves static champion information from Data Dragon
  let championsPromise = 
    axios
      .get(championPoolUrl)
      .catch((error) => logErrorAndReturn(error, callback));

  // Retrieves summoner information
  let summonerPromise = 
    axios
      .get(summonerGetUrl)
      .catch((error) => {
        if(error.response.status == 404)
          handleSummonerNotFound(summonerName, callback)
        else
          logErrorAndReturn(error, callback)
      });

  /* Promise Logic */
  Promise
    .all([championsPromise, summonerPromise])
    .then((responses) => {
      /* Parse out responses */
      let championsResponse = responses[0];
      let summonerResponse = responses[1];
      let champions = championsResponse.data.data;

      /* Successful summoner lookup */
      if (summonerResponse.status == 200)
      {
        handleSummonerFound(summonerName, summonerResponse.data.summonerLevel, summonerResponse.data.id, champions, context, callback);
      }
      /* Other status code */
      else
      {
        logErrorAndReturn("Whoops! Looks like an issue communicating with Riot! Please try again later.", callback);
      }
    })
};

/* Matches champion Id from the Masteries information to the static information from DataDragon to get the champion name */
function getTopChampionName(champions, topChampionId) {
  for(const prop in champions)
  {
    if(champions[prop] != null && 
      champions[prop] !== 'undefined' && 
      champions[prop].key.toString() == topChampionId.toString())
    {
      return champions[prop].id;
    }
  }
}

/* Assembles the text response with releveant summoner and champion mastery information */
function handleSummonerFound(summonerName, summonerLevel, summonerId, champions, context, callback){
  /* Variable Set Up */
  const masteriesBaseUrl = context.Riot_Base_Url + '/lol/champion-mastery/v4/champion-masteries/by-summoner/' + summonerId + '?api_key=' + context.Riot_Api_Key;
  let message = "Summoner " + summonerName + " found. " + summonerName + " is level " + summonerLevel + ". ";
  let twiml = new Twilio.twiml.MessagingResponse()

  console.log("Summoner found!");

  axios
    .get(masteriesBaseUrl)
    .then((masteryResponse) => {
      let topChampionId = masteryResponse.data[0].championId;
      let topChampionPoints = masteryResponse.data[0].championPoints;
      let topChampion = getTopChampionName(champions, topChampionId);
      message += summonerName + "'s champion with the highest points is " + topChampion + ", at " + topChampionPoints + " points!";
      twiml.message(message);
      completeCallback(twiml, callback);
    })
    .catch((error) => {
      logErrorAndReturn(error, callback);
    })
}

/* Handles no summoner found cleanly */
function handleSummonerNotFound(summonerName, callback) {
  let twiml = new Twilio.twiml.MessagingResponse()
  twiml.message("Summoner " + summonerName + " was not found.")
  console.log("Summoner not found.");
  completeCallback(twiml, callback);
}

/* Generic error and log catching function */
function logErrorAndReturn(error, callback) {
  console.log(error);
  callback(error, null);
}

/* Generic callback completion function */
function completeCallback(twiml, callback){
  callback(null, twiml)
}
```

<p>Save, and deploy your function.</p>

<h2>Twilio Number Purchase</h2>

<p>Almost there! Now that our function is set up and ready to go, we need to attach it to a phone number. Go to the phone numbers module in Twilio, and purchase a new number. You can also use an existing number, assuming it has no other current uses.</p>

<p>Select your desired number, and give it a nice friendly name so we know what it does at first glance (<code>League Bot</code> or <code>Summoner Bot</code>, perhaps).</p>

<p>Moving down to the Messaging section, we want to trigger our function when a message comes in. Under "A Message Comes In", select "Function", then select the service you created for your LoL bot. Select the appropriate environment, and then select the path that your function is defined under (you would have set this when you first created the function).</p>

<p>Hit save, and then boom! You have a working summoner name check bot! Try texting your new number with a LoL summoner name and see what happens!</p>

<h2>Troubleshooting</h2>

<p>If you aren't having luck with this bot, try some of the following:</p>

<ul>
  <li>Ensure you're using the right region base url from Riot</li>
  <li>Ensure your Riot Games API key is correct and has not expired</li>
  <li>Try enabling live debugging for your twilio function, and console log out any trouble spots in the code execution</li>
  <li>Use Twilio's debugger tool to trace back where an issue is occurring</li>
</ul>
