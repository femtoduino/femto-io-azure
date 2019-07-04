module.exports = function (context, req) {

    // This "flow" is based on the following article:
    // https://kvaes.wordpress.com/2017/10/13/azure-iot-hub-generating-using-sas-tokens-for-a-device/
    var iothub = require('azure-iothub'); // npm install --save azure-iothub
    var crypto = require('crypto'); // Built-in to Node.
    var connectionString = process.env.iothubconnectionstring;
    var iothubHost = process.env.iothubhostname;
    var iothubdevicekey = process.env.iothubdevicekey;
    var deviceId = typeof req.query.deviceid != 'undefined' ? 
                        req.query.deviceid :
                        null;

    if (deviceId) {
        deviceId.replace(/[^a-zA-Z0-9_-]+/g, ''); // remove non-alphanumeric, _, -
    }

    if (deviceId && deviceId.length > 1) { 

        var expiresTimestamp = 0;
        // The logic follow's Microsoft's IoTHub SAS Token generator sample.
        // See https://stackoverflow.com/a/37383699/700227 and 
        // See https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-security#security-tokens
        var generateSasToken = (resourceUri, signingKey, policyName, expiresInMins) => {
            resourceUri = encodeURIComponent(resourceUri);
        
            // Set expiration in seconds
            var expires = (Date.now() / 1000) + expiresInMins * 60;
            expires = Math.ceil(expires);
            var toSign = resourceUri + '\n' + expires;
            expiresTimestamp = expires;
        
            // Use crypto
            var hmac = crypto.createHmac('sha256', new Buffer(signingKey, 'base64'));
            hmac.update(toSign);
            var base64UriEncoded = encodeURIComponent(hmac.digest('base64'));
        
            // Construct authorization string
            var token = "SharedAccessSignature sr=" + resourceUri + "&sig="
            + base64UriEncoded + "&se=" + expires;
            if (policyName) token += "&skn="+policyName;
            return token;
        };
        var sasToken = generateSasToken(iothubHost + "/devices/" + deviceId, iothubdevicekey, null, 60);

        context.res = {
            "status": 200,
            "body": "OK",
            "headers": {"sastoken": sasToken, "sasexpires": expiresTimestamp}
        };
        context.done();
    } else {
        context.res = {
            "status": 400,
            "body": "'deviceid' must not be empty, and may only contain alphanumeric, -, or _"
        };
        context.done();
    }
};