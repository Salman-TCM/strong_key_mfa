
const DID = 1;
const PROTOCOL = "FIDO2_0";
const AUTHTYPE = "PASSWORD";
const SVCUSERNAME = "svcfidouser";
const SVCPASSWORD = "Abcd1234!";

exports.SKFS_HOSTNAME = "";
exports.SKFS_PORT="8181";
exports.SVCINFO = {
     did: DID,
     protocol: PROTOCOL,
     authtype: AUTHTYPE,
     svcusername: SVCUSERNAME,
     svcpassword: SVCPASSWORD
       };

exports.SKFS_PREAUTHENTICATE_PATH = '/skfs/rest/preauthenticate'
exports.SKFS_AUTHENTICATE_PATH = '/skfs/rest/authenticate'
exports.SKFS_PREREGISTRATION_PATH = '/skfs/rest/preregister'
exports.SKFS_REGISTRATION_PATH = '/skfs/rest/register'
exports.SKFS_GET_KEYS_INFO_PATH = '/skfs/rest/getkeysinfo'
exports.SKFS_DEREGISTER_PATH = '/skfs/rest/deregister'

exports.METADATA_VERSION = "1.0"
exports.METADATA_LOCATION = "Cupertino, CA"

