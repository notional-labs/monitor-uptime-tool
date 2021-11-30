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
    let chainFile = "chains/mainnet/" + chainName + ".json";
    let chain = JSON.parse(readFileSync(chainFile, 'utf-8'));

    if (!chain.sdk_version) {
      chain.sdk_version = '0.33';
    }

    return chain;
}

/**
 * get url from a chain
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

/**
 * get batch url for batch chain
 * @param {Array<*>} urlArr [{chainName: "", url: ""}, ...]
 */
async function getBatch(urlArr = [{chainName: "cosmos", url: ""}]) {
    let retArr = []
    
    // asynchronously get from a batch of urls
    await Promise.all(urlArr.map(async (ele) => {
        if(ele.chainName == ""){
            throw new Error("chain name is empty in one of element of urlArr")
        }

        const ret = await get(ele.chainName, ele.url);

        retArr.push(ret);
    }));

    return retArr;
}

//============ END BASE GROUP ============