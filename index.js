/*
 * Main thread of the AI chatbot Columbus on Slack, it
 * contains two type of tasks:
 *
 * 1) Scheduled task, saying something to #apac-ai-team at specific time
 * 2) Keep listening to the #apac-ai-team channel, response to certain chat patterns
 *
 * by huoding.li@compass.com
 * Jan 8th, 2025
 */
global.ReadableStream = require('web-streams-polyfill').ReadableStream;

require("dotenv").config();
const { App, matchMessage, subtype } = require("@slack/bolt");
const { talk2AI } = require("./openai");


// Initializes your app with your bot token and signing secret
const app = new App({
   signingSecret: process.env.SLACK_SIGNING_SECRET,
   token: process.env.SLACK_BOT_TOKEN,
});

// Processing the slack command /captain
app.command( "/captain", async( command, ack, say ) => {
	try{
		await ack();
		say( "Yahoo! What do you need me to do, sailor?" );
	} catch( error ){
		console.log( "Slack command ERROR: ");
		console.log( error );
	}
});

// Process Slack message events.
app.message( matchMessage('<'), async ({ context, message, say }) => {

    try {
		//console.log( context );
		//console.log( message );
		let msg = message.text;
        
		let head = msg.indexOf("<");
        if( head > 0 ){
		    msg = msg.slice( 0, head-1 );
            msg = msg + " YOU";
        }else{
            let head2 = msg.indexOf(">, ");
		    msg = msg.slice( head+3, msg.end );
        }

		const reply = await talk2AI( msg );
		//console.log( reply );
      	await say( reply );

    } catch (error) {
        console.log("Columbus is deaf: ")
	    console.error(error);
    }

});


//
// Start the back-end server listenning to Slack events.
//
(async () => {
     // Start your app
     await app.start( process.env.PORT );
     console.log(`Slack Bolt [Columbus] is running on port ${process.env.PORT}!`);
})();
