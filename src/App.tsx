// import { useState } from 'react'
import elliptic from 'elliptic'
import KeyEncoder from 'key-encoder'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import buffer from 'buffer'
import jsSha from 'js-sha256'

function App() {
  // const [count, setCount] = useState(0)

  const generateKey = () => {
    const EC = elliptic.ec

    // Create and initialize EC context
    // (better do it once and reuse it)
    var ec = new EC('secp256k1')

    // // Generate keys
    window.Buffer = buffer.Buffer
    var keys = ec.genKeyPair()
    const rawPrivateKey = keys.getPrivate('hex')
    const rawPublicKey = keys.getPublic('hex')
    const keyEncoder = new KeyEncoder('secp256k1')
    const pemPrivateKey = keyEncoder.encodePrivate(
      rawPrivateKey,
      'raw',
      'pem',
      'pkcs8'
    )
    window.localStorage.setItem('publicKey', rawPublicKey)
    window.localStorage.setItem('privateKey', rawPrivateKey)
    const pemPublicKey = keyEncoder.encodePublic(rawPublicKey, 'raw', 'pem')
    console.log(pemPrivateKey)
    console.log(pemPublicKey)
  }

  const generateSignature = () => {
    const hash = jsSha.sha256('Hello world!')
    console.log(hash)
    const EC = elliptic.ec
    const ec = new EC('secp256k1')
    const key = ec.keyFromPrivate(localStorage.getItem('privateKey')!, 'hex')
    const signature = key.sign(hash)
    console.log(signature)
    console.log(signature.toDER())
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={generateKey}>Geerate key</button>
        <button onClick={generateSignature}>Sign message</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
