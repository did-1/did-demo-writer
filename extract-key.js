import KeyEncoder from 'key-encoder';
import fs from "fs";
import asn1 from "asn1.js";
import crypto from "crypto";

const ECPrivateKey = asn1.define('ECPrivateKey', function() {
    this.seq().obj(
        this.key('version').int(),
        this.key('privateKey').octstr(),
        this.key('parameters').optional().explicit(0).objid(),
        this.key('publicKey').optional().explicit(1).bitstr()
    );
});

const keyType = process.argv[2];
const filePath = process.argv[3];

if (!['private', 'public'].includes(keyType)) {
    console.error('Invalid key type');
    console.error('Usage: node extract-key.js [private|public] <file-path>');
    process.exit(1);
}

if (!filePath) {
    console.error('Please provide a key path as an argument');
    console.error('Usage: node extract-key.js [private|public] <file-path>');
    process.exit(1);
}

let pemContents;
try {
    pemContents = fs.readFileSync(filePath, 'utf8');
} catch (err) {
    console.error('Error reading file:', err.message);
    process.exit(1);
}

const keyEncoder = new KeyEncoder.default('secp256k1')

if (keyType === 'public') {
  const rawPublicKey = keyEncoder.encodePublic(
    pemContents,
    'pem',
    'raw'
  )
  console.log(rawPublicKey);
} else {
    // Convert PEM to DER
    const privateKey = crypto.createPrivateKey(pemContents);
    const derBuffer = privateKey.export({ type: 'sec1', format: 'der' });
    
    // Parse the DER structure
    const parsed = ECPrivateKey.decode(derBuffer, 'der');
    
    // Get the private key bytes
    const rawPrivateKey = parsed.privateKey;
    
    console.log('Raw private key (hex):');
    console.log(rawPrivateKey.toString('hex'));
}
