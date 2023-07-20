import { useState } from 'react'
import elliptic from 'elliptic'
import KeyEncoder from 'key-encoder'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import buffer from 'buffer'
import jsSha from 'js-sha256'

const STORAGE_KEYS = {
  privateKey: 'privateKey',
  publicKey: 'publicKey'
}

const Api = () => {
  const API_URL = 'http://localhost:3000'
  const makeRequest = async (method = 'GET', endpoint = '/', params = {}) => {
    let data = {}
    try {
      const reponse = await fetch(API_URL + endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })
      data = await reponse.json()
    } catch (e) {
      console.error(e)
    }
    return data
  }
  return {
    validateKey: async (domain: string, publicKey: string) => {
      return await makeRequest('POST', `/users/${domain}/validate`, {
        publicKey
      })
    }
  }
}

function App() {
  const [step, setStep] = useState(0)
  const [username, setUsername] = useState('')

  const generateKeys = () => {
    const EC = elliptic.ec
    var ec = new EC('secp256k1')
    var keys = ec.genKeyPair()
    const rawPrivateKey = keys.getPrivate('hex')
    const rawPublicKey = keys.getPublic('hex')
    window.localStorage.setItem(STORAGE_KEYS.publicKey, rawPublicKey)
    window.localStorage.setItem(STORAGE_KEYS.privateKey, rawPrivateKey)
    setStep(1)
  }

  const downloadPrivateKey = () => {
    window.Buffer = buffer.Buffer
    const rawPrivateKey = localStorage.getItem(STORAGE_KEYS.privateKey)
    if (rawPrivateKey) {
      const keyEncoder = new KeyEncoder('secp256k1')
      const pemPrivateKey = keyEncoder.encodePrivate(
        rawPrivateKey!,
        'raw',
        'pem',
        'pkcs8'
      )
      const blob = new Blob([pemPrivateKey])
      const a = window.document.createElement('a')
      a.href = window.URL.createObjectURL(blob)
      a.download = `did-private.pem`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const getPublicKeyPem = () => {
    window.Buffer = buffer.Buffer
    const rawPublicKey = localStorage.getItem(STORAGE_KEYS.publicKey)
    if (rawPublicKey) {
      const keyEncoder = new KeyEncoder('secp256k1')
      const pemPublicKey = keyEncoder.encodePublic(rawPublicKey, 'raw', 'pem')
      return pemPublicKey
    } else {
      throw 'Public key missing'
    }
  }

  const downloadPublicKey = () => {
    const pemPublicKey = getPublicKeyPem()
    const blob = new Blob([pemPublicKey])
    const a = window.document.createElement('a')
    a.href = window.URL.createObjectURL(blob)
    a.download = `did.pem`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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

  const renderDowloadKeys = () => {
    if (!localStorage.getItem(STORAGE_KEYS.privateKey)) {
      return null
    }
    return (
      <div>
        <h3>✅ Step 1: Generate private and public keys:</h3>
        <button onClick={downloadPrivateKey}>Download private key</button>
        <button onClick={downloadPublicKey}>Download public key</button>
      </div>
    )
  }

  const renderGenerateKeys = () => {
    if (localStorage.getItem(STORAGE_KEYS.privateKey)) {
      return null
    }
    return (
      <div>
        <h2>Step 1: Generate private and public keys:</h2>
        <button onClick={generateKeys}>Generate keys</button>
      </div>
    )
  }

  const validateDomain = async () => {
    const response = await Api().validateKey(username, getPublicKeyPem())
    console.log(response)
  }

  const renderValidateDomain = () => {
    if (!localStorage.getItem(STORAGE_KEYS.privateKey)) {
      return null
    }
    return (
      <div>
        <h3>
          Step 2: Prove domain ownership by uploading public key to a domain
          that you own
        </h3>
        http://
        <input
          placeholder="example.com"
          onChange={(e) => setUsername(e.target.value)}
          value={username}
        />
        /did.pem
        <button onClick={validateDomain}>Validate</button>
      </div>
    )
  }

  return (
    <>
      <h1>
        Submit your first social post to DID (Decentralized Information
        Distributor)
      </h1>
      {renderGenerateKeys()}
      {renderDowloadKeys()}
      {renderValidateDomain()}
      <div class="step hidden" id="step3">
        <h2>Step 3: Write your social post and download generated html file</h2>
        <p>This post will be signed with your private key</p>
        <label for="post">Your post:</label>
        <br />
        <textarea id="post"></textarea>
        <br />
        <button>Download social post file</button>
      </div>
      <div class="step hidden" id="step4">
        <h2>Step 4: Upload your social post file to a public URL</h2>
        http://example.com/
        <input id="url" placeholder="did/first-post" />
        <button>Check URL</button>
      </div>
      <div class="step hidden" id="step5">
        <h2>Step 5: Submit your post to DID node</h2>
        Node: tautvilas.lt
        <br />
        <button>Submit</button>
      </div>
      <div class="step hidden" id="step6">
        <h2>Step 6: See your social posts appear on a reader platform</h2>
        <a href="#">Open link</a>
      </div>
      <button
        onClick={() => {
          window.localStorage.clear()
          setStep(0)
        }}
      >
        Reset {step}
      </button>
    </>
  )
}

export default App
