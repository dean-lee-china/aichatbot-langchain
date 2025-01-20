import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const llmModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0
});

const parser =  new StringOutputParser();

export async function talk2AI( question: string ) {

	console.log( `Slack bot was asked: ${question}` );

	const prompt = ChatPromptTemplate.fromMessages([
		new SystemMessage( "You are a helpful assistant" ),
		new HumanMessage( question )
	]);

	const chain = prompt.pipe( llmModel ).pipe( parser );
	const answer = await chain.invoke( question );

	//console.log( "---- Frome OpenAI ----");
	//console.log( answer );
	return answer;
}

