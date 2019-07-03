module.exports = function (context, req) {
    var iothub = require('azure-iothub');
    var connectionString = process.env.iothubconnectionstring;
    var iothubHost = process.env.iothubhostname;
    var deviceId = typeof req.query.deviceid != 'undefined' ? 
                        req.query.deviceid :
                        null;

    if (deviceId) {
        deviceId.replace(/[\W_-]+/g, ''); // remove non-alphanumeric, _, -
    }

    if (deviceId && deviceId.length > 1) { 
        var registry = iothub.Registry.fromConnectionString(connectionString);
        registry.get(deviceId, (err, getDevDesc) => {
            var deviceKey = getDevDesc.authentication.symmetricKey.primaryKey;
            // HostName=iothubname.azure-devices.net;DeviceId=deviceid;SharedAccessKey=SasKey
            var sasToken = "HostName=iothubHost;DeviceId=deviceId;SharedAccessKey=deviceKey";
            var sasToken = sasToken.replace("deviceId", deviceId);
            var sasToken = sasToken.replace("deviceKey", deviceKey);
            var sasToken = sasToken.replace("iothubHost", iothubHost);

            var deviceSdk = require('azure-iot-device');
            var deviceSas = require('azure-iot-device').SharedAccessSignature;
            var anHourFromNow = require('azure-iot-common').anHourFromNow;
            var sasTokenDevice = deviceSas.create(iothubHost, deviceKey, sasToken, anHourFromNow()).toString();

            context.res = {
                "status": 200,
                "body": "OK",
                "headers": {"sastoken": sasTokenDevice, "sasexpires": anHourFromNow()}
            };
            context.done();
        });

    } else {
        context.res = {
            "status": 400,
            "body": "'deviceid' must not be empty, and may only contain alphanumeric, -, or _"
        };
        context.done();
    }
};