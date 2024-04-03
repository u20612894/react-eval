import { Client } from 'paho-mqtt';
import * as moment from 'moment';
import { useState, useEffect } from 'react';
import { HmacSHA256, SHA256, enc } from 'crypto-js';
import Dashboard from './Dashboard';
import './Grid.css';

function VendStatus() {
  const [status, setStatus] = useState('');
  
  // Define application constants, including credentails
  const applicationData = {
    clientId: process.env.REACT_APP_CLIENT_ID,
    accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
    region: process.env.REACT_APP_REGION,
    endpoint: process.env.REACT_APP_ENDPOINT,
    sessionToken: '',
    topic: 'reactTest/status',
  };

  const applicationConstants = {
    OK_CONNECTED: 'Connection OK! Ready to receive data on selected topic: ',
    ERR_CONNECTED: 'Connection ERROR! Reload this page and check your settings. ',
  };

  let mqtt_client;

  function SigV4Utils() {}
  SigV4Utils.sign = function (key, msg) {
    const hash = HmacSHA256(msg, key);
    return hash.toString(enc.Hex);
  };
  SigV4Utils.sha256 = function (msg) {
    const hash = SHA256(msg);
    return hash.toString(enc.Hex);
  };

  SigV4Utils.getSignatureKey = function (key, dateStamp, regionName, serviceName) {
    const kDate = HmacSHA256(dateStamp, `AWS4${key}`);
    const kRegion = HmacSHA256(regionName, kDate);
    const kService = HmacSHA256(serviceName, kRegion);
    const kSigning = HmacSHA256('aws4_request', kService);
    return kSigning;
  };

  const observeStatus = () => {
    // Get timestamp and format data
    const time = moment.utc();
    const dateStamp = time.format('YYYYMMDD');
    const amzdate = `${dateStamp}T${time.format('HHmmss')}Z`;
    // Define constants used to create the message to be signed
    const service = 'iotdevicegateway';
    const { region } = applicationData;
    const secretKey = applicationData.secretAccessKey;
    const accessKey = applicationData.accessKeyId;
    const algorithm = 'AWS4-HMAC-SHA256';
    const method = 'GET';
    const canonicalUri = '/mqtt';
    const host = applicationData.endpoint;

    // Set credential scope to today for a specific service in a specific region
    const credentialScope = `${dateStamp}/${region}/${service}/` + 'aws4_request';
    // Start populating the query string
    let canonicalQuerystring = 'X-Amz-Algorithm=AWS4-HMAC-SHA256';
    // Add credential information
    canonicalQuerystring += `&X-Amz-Credential=${encodeURIComponent(`${accessKey}/${credentialScope}`)}`;
    // Add current date
    canonicalQuerystring += `&X-Amz-Date=${amzdate}`;
    // Add expiry date
    canonicalQuerystring += '&X-Amz-Expires=86400';
    // Add headers, only using one = host
    canonicalQuerystring += '&X-Amz-SignedHeaders=host';
    const canonicalHeaders = `host:${host}\n`;
    // No payload, empty
    const payloadHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty string -> echo -n "" | xxd  | shasum -a 256
    // Build canonical request
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\nhost\n${payloadHash}`;
    console.log(`canonicalRequest: \n${canonicalRequest}`);
    // Hash the canonical request and create the message to be signed
    const stringToSign = `${algorithm}\n${amzdate}\n${credentialScope}\n${SigV4Utils.sha256(canonicalRequest)}`;
    // Derive the key to be used for the signature based on the scoped down request
    const signingKey = SigV4Utils.getSignatureKey(secretKey, dateStamp, region, service);

    // Calculate signature
    const signature = SigV4Utils.sign(signingKey, stringToSign);
    // Append signature to message
    canonicalQuerystring += `&X-Amz-Signature=${signature}`;

    // Append existing security token to the request (since we are using STS credetials) or do nothing    if using IAM credentials
    if (applicationData.sessionToken !== '') {
      canonicalQuerystring += `&X-Amz-Security-Token=${encodeURIComponent(applicationData.sessionToken)}`;
    }
    const requestUrl = `wss://${host}${canonicalUri}?${canonicalQuerystring}`;
   

    mqtt_client = new Client(requestUrl, applicationData.clientId);
    mqtt_client.onMessageArrived = onMessageArrived;
    mqtt_client.onConnectionLost = onConnectionLost;
    mqtt_client.connect(connectOptions);
  };

  function onConnect() {
    console.log('OK: Connected!');

    // subscribe to test topic
    mqtt_client.subscribe(applicationData.topic);
  }
  function onFailure(e) {
    console.log(e);
  }
  function onMessageArrived(m) {
    setStatus(JSON.parse(m.payloadString));
    
  }
  function onConnectionLost(e) {
    console.log(`onConnectionLost:${e}`);
    console.log(e);
  }
  var connectOptions = {
    onSuccess: onConnect,
    onFailure,
    useSSL: true,
    timeout: 10,
  };
  useEffect(() => {
    observeStatus();
  }, []);

  return (

    <div>
      <Dashboard />
      
      {/* First Column */}
      <div className="grid-container">
        <div className="grid-item">
          <h2>Time</h2>
          <h3>{status.time ? new Date(status.time).toLocaleString() : '' }</h3>
        </div>
        <div className="grid-item">
          <h2>Hostname</h2>
          <h3>{status.hostname}</h3>
        </div>
        {/* Second Column */}
        <div className="grid-item">
          <h2>Exhaust</h2>
          <h3>{status.exhaust}</h3>
        </div>
        <div className="grid-item">
          <h2>Ambient</h2>
          <h3>{status.ambient}</h3>
        </div>
        {/* Third Column */}
        <div className="grid-item">
          <h2>DC</h2>
          <h3>{status.DC}</h3>
        </div>
      </div>
    </div>
  );
}

export default VendStatus;
