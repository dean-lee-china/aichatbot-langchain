# aichatbot-langchain
An Slack AI chat bot that powered by OpenAI gpt-o4-mini, linked by LangChain

Preparations:
1. Setup a Slack Channel and create a Slack APP (the chatbot)
1. Get a public IP to deploy this back-end server, hence the Slack Event can push event to certain URL;
2. Get an openAI accout with corresponding API KEY.  

Deploying:
1. cd ${YOUR REPO}
2. npm install
3. export OPENAI_API_KEY=${YOUR_OPENAI_KEY} (VERY IMPORTATNT!!)
4. npm run dev



The output should be similar to:
---------------------------------
> columbus@1.0.0 dev

> nodemon index.js

[nodemon] 3.1.9

[nodemon] to restart at any time, enter `rs`

[nodemon] watching path(s): *.*

[nodemon] watching extensions: js,mjs,cjs,json

[nodemon] starting `node index.js`

(node:105005) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)

Slack Bolt [Columbus] is running on port 8081!

