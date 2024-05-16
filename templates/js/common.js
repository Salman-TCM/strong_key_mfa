/**
 * Copyright StrongAuth, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by the GNU Lesser General Public License v2.1
 * The license can be found at https://github.com/StrongKey/fido2/blob/master/LICENSE
 */
 // JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ
// Here is where we add encoding and decoding functions used in translating FIDO2
// authenticator challenges and responses. Challenges must be converted from Base64
// to Buffer before being sent to the FIDO2 authenticator and the response given by
// the FIDO2 authenticator must be translated from a Buffer to Base64 before it can
// be sent back to the FIDO2SERVER.
function challengeToBuffer(input) {
    input = JSON.parse(input);
    input.Response.challenge = decode(input.Response.challenge);
    if(typeof input.Response.user !== 'undefined'){
      input.Response.user.id = decode(input.Response.user.id);
    }

if (input.Response.excludeCredentials) {
for (let i = 0; i < input.Response.excludeCredentials.length; i++) {
    input.Response.excludeCredentials[i].id = input.Response.excludeCredentials[i].id.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    input.Response.excludeCredentials[i].id = decode(input.Response.excludeCredentials[i].id);
}
}
if (input.Response.allowCredentials) {
for (let i = 0; i < input.Response.allowCredentials.length; i++) {
    input.Response.allowCredentials[i].id = input.Response.allowCredentials[i].id.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    input.Response.allowCredentials[i].id = decode(input.Response.allowCredentials[i].id);
}
}
return input;

}

function responseToBase64(input) {

let copyOfDataResponse = {};
copyOfDataResponse.id = input.id;
copyOfDataResponse.rawId = encode(input.rawId);
if(typeof input.response.attestationObject !== 'undefined'){
  copyOfDataResponse.attestationObject = encode(input.response.attestationObject);
}
if(typeof input.response.authenticatorData !== 'undefined'){
  copyOfDataResponse.authenticatorData = encode(input.response.authenticatorData);
  copyOfDataResponse.signature = encode(input.response.signature);
  copyOfDataResponse.userHandle = encode(input.response.userHandle);
}
copyOfDataResponse.clientDataJSON = encode(input.response.clientDataJSON);
copyOfDataResponse.type = input.type;
return copyOfDataResponse;
}

let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
}
let encode = function (arraybuffer) {
    let bytes = new Uint8Array(arraybuffer),
        i, len = bytes.length, base64url = '';
    for (i = 0; i < len; i += 3) {
        base64url += chars[bytes[i] >> 2];
        base64url += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64url += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64url += chars[bytes[i + 2] & 63];
    }
    if ((len % 3) === 2) {
        base64url = base64url.substring(0, base64url.length - 1);
    } else if (len % 3 === 1) {
        base64url = base64url.substring(0, base64url.length - 2);
    }
    return base64url;
};
let decode = function (base64string) {
    let bufferLength = base64string.length * 0.75,
        len = base64string.length, i, p = 0,
        encoded1, encoded2, encoded3, encoded4;
    let bytes = new Uint8Array(bufferLength);
    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64string.charCodeAt(i)];
        encoded2 = lookup[base64string.charCodeAt(i + 1)];
        encoded3 = lookup[base64string.charCodeAt(i + 2)];
        encoded4 = lookup[base64string.charCodeAt(i + 3)];
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return bytes.buffer
};
 // JJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ
