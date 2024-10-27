# DID Demo Writer

How to import PEM keys to writer:

`npm i`

`node extract-key.js private private.pem` this will output privateKeyHexString

`node extract-key.js public public.pem` this will output pubKeyHexString

inside browser console do:

`localStorage.setItem('privateKey', privateKeyHexString)`

`localStorage.setItem('publicKey', pubKeyHexString)`

refresh the webpage to finish the process
