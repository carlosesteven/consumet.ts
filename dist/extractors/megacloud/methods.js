"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SRC_BASE_URL = void 0;
exports.getMegaCloudClientKey = getMegaCloudClientKey;
exports.decryptSrc2 = decryptSrc2;
const DOMAIN = process.env.ANIWATCH_DOMAIN || 'aniwatchtv.to';
exports.SRC_BASE_URL = `https://${DOMAIN}`;
// client key function
async function getMegaCloudClientKey(xrax) {
    let text;
    try {
        const req = await fetch(`https://megacloud.blog/embed-2/v3/e-1/${xrax}`, {
            headers: { Referer: `${exports.SRC_BASE_URL}/` },
        });
        text = await req.text();
        // regex's for the following key obfuscation methods
        // <meta name="_gg_fb" content="${CLIENTKEY}">                                                          || meta tag
        // <!-- _is_th:${CLIENTKEY} -->                                                                         || comment
        // <script>window._lk_db = {x: "${CLIENTKEY_P1}",y: "${CLIENTKEY_P2}",Z: "${CLIENTKEY_P3}"};</script>   || 3 part key in script (eval would work)
        // <div data-dpi="${CLIENTKEY}"><\/div>                                                                 || div tag
        // <script nonce="${CLIENTKEY}">                                                                        || nonce value
        // <script>window._xy_ws = "${CLIENTKEY}";<\/script>                                                    || window value (eval would work)
        let regex = [
            /<meta name="_gg_fb" content="[a-zA-Z0-9]+">/,
            /<!--\s+_is_th:[0-9a-zA-Z]+\s+-->/,
            /<script>window._lk_db\s+=\s+\{[xyz]:\s+["''][a-zA-Z0-9]+["''],\s+[xyz]:\s+["''][a-zA-Z0-9]+["''],\s+[xyz]:\s+["''][a-zA-Z0-9]+["'']\};<\/script>/,
            /<div\s+data-dpi="[0-9a-zA-Z]+"\s+.*><\/div>/,
            /<script nonce="[0-9a-zA-Z]+">/,
            /<script>window._xy_ws = ['"`][0-9a-zA-Z]+['"`];<\/script>/,
        ];
        // general key regex (wont work without quotes)
        const key = /"[a-zA-Z0-9]+"/;
        // lk_db regex to assemble key in order
        const lk_db_regex = [/x:\s+"[a-zA-Z0-9]+"/, /y:\s+"[a-zA-Z0-9]+"/, /z:\s+"[a-zA-Z0-9]+"/];
        // find the first matching regex
        let pass = null;
        let count = 0;
        for (let test in regex) {
            pass = text.match(regex[test]);
            if (pass !== null) {
                break;
            }
        }
        // if pass is still null we failed :(
        if (pass === null) {
            throw new Error('Failed extracting client key segment');
        }
        // use the count to ensure the right extraction method
        let clientKey = '';
        if (count === 2) {
            // probably a better way to do this but this should work (I dont usually use typescript)
            // we need to test lk_db
            let x = pass[0].match(lk_db_regex[0]);
            if (x === null)
                throw new Error('Failed building client key (xyz)');
            let p1 = x[0].match(key);
            if (p1 === null)
                throw new Error('Failed building client key (xyz)');
            let y = pass[0].match(lk_db_regex[0]);
            if (y === null)
                throw new Error('Failed building client key (xyz)');
            let p2 = y[0].match(key);
            if (p2 === null)
                throw new Error('Failed building client key (xyz)');
            let z = pass[0].match(lk_db_regex[0]);
            if (z === null)
                throw new Error('Failed building client key (xyz)');
            let p3 = z[0].match(key);
            if (p3 === null)
                throw new Error('Failed building client key (xyz)');
            clientKey = `${p1[0].replace(/"/g, '')}${p2[0].replace(/"/g, '')}${p3[0].replace(/"/g, '')}`;
        }
        else if (count === 1) {
            // comment ones dont have "'s and I forgot about that when making the regex catchall
            var keytest = pass[0].match(/:[a-zA-Z0-9]+ /);
            if (keytest === null)
                throw new Error('Failed extracting client key (nonce)');
            clientKey = keytest[0].replace(/:/g, '').replace(/ /g, '');
        }
        else {
            // all other obfuscation methods should be caught here
            var keytest = pass[0].match(key);
            if (keytest === null)
                throw new Error('Failed extracting client key');
            clientKey = keytest[0].replace(/"/g, '');
        }
        return clientKey;
    }
    catch (err) {
        throw err;
    }
}
// extract helper functions
// I extracted them and then rewrote them (hence the 2)
// this should work 99% of the time
function decryptSrc2(src, clientKey, megacloudKey) {
    var layers = 3;
    var genKey = keygen2(megacloudKey, clientKey);
    var decSrc = atob(src);
    var charArray = [...Array(95)].map((_val, index) => {
        return String.fromCharCode(32 + index);
    });
    var reverseLayer = function (iteration) {
        var layerKey = genKey + iteration;
        // identical code to seedShuffle2
        var hashVal = 0n;
        for (var i = 0; i < layerKey.length; i++) {
            hashVal = (hashVal * 31n + BigInt(layerKey.charCodeAt(i))) & 0xffffffffn;
        }
        var seed = hashVal;
        var seedRand = (arg) => {
            seed = (seed * 1103515245n + 12345n) & 0x7fffffffn;
            return Number(seed % BigInt(arg));
        };
        // seed shift
        decSrc = decSrc
            .split('')
            .map((char, _index) => {
            var cArryIndex = charArray.indexOf(char);
            if (cArryIndex === -1)
                return char;
            var randNum = seedRand(95);
            var newCharIndex = (cArryIndex - randNum + 95) % 95;
            return charArray[newCharIndex];
        })
            .join('');
        // perform the transposition cipher
        decSrc = columnarCipher2(decSrc, layerKey);
        // generate the substitution array
        var subValues = seedShuffle2(charArray, layerKey);
        // character map building
        var charMap = {};
        subValues.forEach((char, index) => {
            charMap[char] = charArray[index];
        });
        // sub any character in the charmap with its charArry character
        decSrc = decSrc
            .split('')
            .map(char => {
            return charMap[char] || char;
        })
            .join('');
    };
    for (var i = layers; i > 0; i--) {
        reverseLayer(i);
    }
    // console.log(decSrc);
    var dataLen = parseInt(decSrc.substring(0, 4), 10);
    return decSrc.substring(4, 4 + dataLen);
}
function keygen2(megacloudKey, clientKey) {
    var keygenHashMultVal = 31n; // this value changed from 47
    var keygenXORVal = 247; // changed from 179
    var keygenShiftVal = 5; // changed from 7
    var tempKey = megacloudKey + clientKey;
    // numeric hash
    var hashVal = 0n;
    for (var i = 0; i < tempKey.length; i++) {
        hashVal = BigInt(tempKey.charCodeAt(i)) + hashVal * keygenHashMultVal + (hashVal << 7n) - hashVal;
    }
    // get the absolute value of the hash
    hashVal = hashVal < 0n ? -hashVal : hashVal;
    var lHash = Number(hashVal % 0x7fffffffffffffffn); // limit the hash to 64 bits
    // apply XOR
    tempKey = tempKey
        .split('')
        .map(c => {
        return String.fromCharCode(c.charCodeAt(0) ^ keygenXORVal);
    })
        .join('');
    // circular shift
    var pivot = (lHash % tempKey.length) + keygenShiftVal;
    tempKey = tempKey.slice(pivot) + tempKey.slice(0, pivot);
    // leaf in values (one is undefined while the other isnt generally)
    var leafStr = clientKey.split('').reverse().join('');
    var returnKey = '';
    for (var i = 0; i < Math.max(tempKey.length, leafStr.length); i++) {
        returnKey += (tempKey[i] || '') + (leafStr[i] || '');
    }
    // limit the length of the key based on the hash
    returnKey = returnKey.substring(0, 96 + (lHash % 33));
    // normalise to ASCII values
    returnKey = [...returnKey]
        .map(c => {
        return String.fromCharCode((c.charCodeAt(0) % 95) + 32);
    })
        .join('');
    return returnKey;
}
function seedShuffle2(CharacterArray, iKey) {
    // hash the iterations key
    var hashVal = 0n;
    for (var i = 0; i < iKey.length; i++) {
        hashVal = (hashVal * 31n + BigInt(iKey.charCodeAt(i))) & 0xffffffffn;
    }
    // set the seed to the current hash val
    var shuffleNum = hashVal;
    var psudoRand = (arg) => {
        shuffleNum = (shuffleNum * 1103515245n + 12345n) & 0x7fffffffn;
        return Number(shuffleNum % BigInt(arg));
    };
    //shuffle the character array based on the seed
    var retStr = [...CharacterArray];
    for (var i = retStr.length - 1; i > 0; i--) {
        var swapIndex = psudoRand(i + 1);
        //swap
        [retStr[i], retStr[swapIndex]] = [retStr[swapIndex], retStr[i]];
    }
    return retStr;
}
function columnarCipher2(src, ikey) {
    // setup the rows/column count
    var columnCount = ikey.length;
    var rowCount = Math.ceil(src.length / columnCount);
    // generate the cipher
    var cipherArry = Array(rowCount)
        .fill(null)
        .map(() => {
        return Array(columnCount).fill(' ');
    });
    // generate the key-index map
    var keyMap = ikey.split('').map((char, index) => {
        return { char: char, idx: index };
    });
    // sorted via charcode
    var sortedMap = [...keyMap].sort((a, b) => {
        return a.char.charCodeAt(0) - b.char.charCodeAt(0);
    });
    // fill the cipher array
    var srcIndex = 0;
    sortedMap.forEach(({ idx: index }) => {
        for (var i = 0; i < rowCount; i++) {
            cipherArry[i][index] = src[srcIndex++];
        }
    });
    // collapse the array
    var returnStr = '';
    for (var x = 0; x < rowCount; x++) {
        for (var y = 0; y < columnCount; y++) {
            returnStr += cipherArry[x][y];
        }
    }
    return returnStr;
}
//# sourceMappingURL=methods.js.map