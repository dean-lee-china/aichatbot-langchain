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
import * as path from 'path';
import { DownloaderHelper } from "node-downloader-helper";
import { talk2AI } from "./openai.js";
import { processFile } from "./file.js";

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
const fileBase = process.env.FILE_BASE;

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

        let reply = "";

        if( message.subtype === 'message_deleted' ){
            reply = 'HEY! I have noticed that you have deleted something, sailor!'
            await say( reply );
        }

        else if( message.subtype === 'file_share' ){

            //console.log( message );

            // Download the uploaded file to Slack Channel/DM to 
            // local disk for learning.
            const file = message.files[0];
            const fileName = file.name;
            const filePath = path.join( fileBase, fileName );
            const url = file.url_private_download;

            const dl = new DownloaderHelper( url, fileBase, {
                method: 'GET',
                headers: { 'Authorization':`Bearer ${context.botToken}` },
                resumeOnIncomplete: true,
                resumeOnIncompleteMaxRetry: 5,
            });

            dl.on( 'end', ()=> console.log( `> File ${url} is downloaded.....` ));
            dl.on( 'error', (err) => console.log( `> File ${url} download failed.....` ));
            dl.start().catch( err => console.error(err));

            processFile( userId, filePath );
        }

        // DEFAULT: normal text message
        // For the following situations in a Slack Channel:
        // 1) if Columbus is @,
        // 2) there is a broadcasting,
        // 3) key word 'columbus' or 'captain' is mentioned,
        // 4) the message is not empty.
        // 
        // he will response.
        else if(message.subtype === undefined ){

            if(( msg.includes(atBotPrefix) || 
                 msg.toLowerCase().includes( "columbus" ) || 
                 msg.toLowerCase().includes( "captain" )  || 
                 message.channel_type === "im" // Somebody chat directly within the APP.
               ) && msg.length > 0 ){

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
                reply = await talk2AI( userId,  msg );
                
                // @User back in public channel back, 
                // but not necessary in DM of APP
                if( message.channel_type === "channel" ){
                    reply = atUserPrefix + reply;
                }
                
                // Reply in a channel or a thread 
                if( message.thread_ts === undefined ){ 
                    await say( reply );
                } else {
                    await say( { text: reply, thread_ts: message.ts } );
                }
            }
        }

    } catch (error) {
        console.log("FATAL Internal ERROR: Columbus is deaf!");
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
