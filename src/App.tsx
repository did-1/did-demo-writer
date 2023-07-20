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

function App() {
  const [step, setStep] = useState(0)

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

  const downloadPublicKey = () => {
    window.Buffer = buffer.Buffer
    const rawPublicKey = localStorage.getItem(STORAGE_KEYS.publicKey)
    if (rawPublicKey) {
      const keyEncoder = new KeyEncoder('secp256k1')
      const pemPublicKey = keyEncoder.encodePublic(rawPublicKey, 'raw', 'pem')
      const blob = new Blob([pemPublicKey])
      const a = window.document.createElement('a')
      a.href = window.URL.createObjectURL(blob)
      a.download = `did.pem`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
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
        Step 1: Generate private and public keys:
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
        Step 1: Generate private and public keys:
        <button onClick={generateKeys}>Generate keys</button>
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
