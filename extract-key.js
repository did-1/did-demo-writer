import KeyEncoder from 'key-encoder';
import fs from "fs";

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
  const rawPrivateKey = keyEncoder.encodePrivate(
    pemContents,
    'pem',
    'raw',
    'pkcs8'
  )
  console.log(rawPrivateKey);
}
