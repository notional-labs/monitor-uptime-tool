import {readFileSync} from "fs"
import fetch from "node-fetch"
// HELPER FOR GETTING INFORMATION

//============ BASE GROUP ============
/**
 * get one chain
 * @param {String} chainName 
 * @returns 
 */
function getSelectedChainConfig(chainName) {
    //get chains
    let chainFile = chainName + ".json";
    let chain = JSON.parse(readFileSync(chainFile, 'utf-8'));

    if (!chain.sdk_version) {
      chain.sdk_version = '0.33';
    }

    return chain;
}

function getBatchChainConfig(){

}

/**
 * 
 * @param {String} chainName 
 * @param {String} url 
 * @param {*} config 
 * @returns 
 */
async function get(chainName, url, config = null) {
    if (!config) {
        config = getSelectedChainConfig(chainName)
    }

    const ret = await fetch((config ? config.api : config.api) + url).then(response => response.json())
    return ret;
}

async function getBatch(url) {
    
}

//============ END BASE GROUP ============