/* This is a module that process all the files
 * shared by any slack user 
 */
import { getTimeStamp } from "./utils.js";

export function processFile( who:string, fileName:string ){
    const timeStamp = getTimeStamp();
    console.log( `[ ${timeStamp} ]> Slack user [${who}] share a file: ${fileName}` );
}
