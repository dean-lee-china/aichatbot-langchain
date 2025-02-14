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

import dotenv from "dotenv";
import slackBot from '@slack/bolt';
import { talk2AI } from "./openai.js";
import { ReadableStream } from "web-streams-polyfill";

//
// Initializes your app with your bot token and signing secret
//
dotenv.config();
global.ReadableStream = ReadableStream;
const { App, matchMessage, subtype } = slackBot;
const app = new App({
   signingSecret: process.env.SLACK_SIGNING_SECRET,
   token: process.env.SLACK_BOT_TOKEN,
});


//
// Process all the slack messages.
//
app.event( 'message', async ({ context, message, say }) => {

    try {

		let msg = message.text;

        const userId = context.userId;
        const botId = context.botUserId;
        const atBotPrefix = '<@' + botId + '>';
        const atUserPrefix = '<@' + userId + '> ';

        // For the following situations in a Slack Channel:
        // 1) if Columbus is @,
        // 2) there is a broadcasting,
        // 3) key word 'columbus' or 'captain' is mentioned,
        // 
        // he will response.
        if( msg.includes(atBotPrefix) || 
            msg.toLowerCase().includes( "columbus" ) || 
            msg.toLowerCase().includes( "captain" ) ){

            // Preprocessing the message, replacing @Columbus
            // with YOU for a better syntax.	
            let idx = msg.indexOf( atBotPrefix );
            if( idx > 0 ){
                msg = msg.replace( atBotPrefix, 'you' ); 
            } 
            else if( idx == 0 ) { 
	    	    msg = msg.replace( atBotPrefix, '' );
            }

            // Pass the text to AI
            let reply = await talk2AI( userId,  msg );
            reply = atUserPrefix + reply;

            if( message.thread_ts === undefined ){
      	        await say( reply );
            } else { // Somebody @him with a slack thread
      	        await say( { text: reply, thread_ts: message.ts } );
            }

        // Somebody chat directly within the APP.
        } else if ( message.channel_type === "im" ){
            const reply = await talk2AI( userId,  msg );
      	    await say( reply );
        }

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
