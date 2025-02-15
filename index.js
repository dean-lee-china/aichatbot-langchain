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

import { talk2AI } from "./openai.js";
import { config } from "dotenv";
import { ReadableStream } from "web-streams-polyfill";
import slackBot from '@slack/bolt';

const { App, matchMessage, subtype } = slackBot;
global.ReadableStream = ReadableStream;
config();

//
// Initializes your app with your bot token and signing secret
//
const app = new App({
   signingSecret: process.env.SLACK_SIGNING_SECRET,
   token: process.env.SLACK_BOT_TOKEN,
});


//
// Processing the slack command /captain
//
app.command( "/captain", async( command, ack, say ) => {
	try{
		await ack();
		say( "Yahoo! What do you need me to do, sailor?" );
	} catch( error ){
		console.log( "Slack command ERROR: ");
		console.log( error );
	}
});


//
// Process Slack message events.
// Slack message is always start with <$USER_ID> $CHAT_CONTENT
//
app.message( matchMessage('<@'), async ({ context, message, say }) => {

    try {

		let msg = message.text;
        const userId = context.userId;
        const botId = context.botUserId;
       
        // Preprocessing the message. 
        const atBotPrefix = '<@' + botId + '>';
		let idx = msg.indexOf( atBotPrefix );
        if( idx > 0 ){
            msg = msg.replace( atBotPrefix, 'you' ); 
        }else{
		    msg = msg.replace( atBotPrefix, '' );
        }

        const atUserPrefix = '<@' + userId + '> ';
		const reply = await talk2AI( userId,  msg );
      	await say( atUserPrefix + reply );

    } catch (error) {
        console.log("FATA Internal ERROR: Columbus is deaf!");
        console.log("======================================");
	    console.error(error);
    }

});


//
// Start the back-end server listenning to Slack events.
//
(async () => {
     await app.start( process.env.PORT );
     console.log(`Slack AI Chatbot [Columbus] is listening on port ${process.env.PORT}!`);
})();
