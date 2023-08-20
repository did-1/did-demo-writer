import { useState, useRef } from 'react'
import elliptic from 'elliptic'
import KeyEncoder from 'key-encoder'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import buffer from 'buffer'
import jsSha from 'js-sha256'
import { Flipper, Flipped } from 'react-flip-toolkit'

const STORAGE_KEYS = {
  privateKey: 'privateKey',
  publicKey: 'publicKey',
  publicKeyDownloaded: 'publicKeyDownloaded',
  username: 'personalDomain',
  content: 'content',
  downloadedContent: 'downloadedContent',
  postData: 'postData',
  path: 'path',
  started: 'started',
  submitted: 'submitted',
  done: 'done'
}

const API_URL = 'http://localhost:3000'

const Api = () => {
  const makeRequest = async (
    method = 'GET',
    endpoint = '/',
    params?: any
  ): Promise<any> => {
    let data = {}
    const settings = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: params ? JSON.stringify(params) : null
    }
    try {
      const reponse = await fetch(API_URL + endpoint, settings)
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
    },
    validatePath: async (domain: string, path: string) => {
      return await makeRequest('POST', `/users/${domain}/path/validate`, {
        path
      })
    },
    submitPost: async (domain: string, params: any) => {
      return await makeRequest('POST', `/users/${domain}/post`, params)
    },
    getLastBlock: async () => {
      return await makeRequest('GET', `/block/latest`)
    }
  }
}

function escapeHTML(str: string) {
  let div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  const content = div.innerHTML
  // document.body.removeChild(div)
  return content.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function App() {
  const domainInput = useRef(null)
  const pathInput = useRef(null)
  const pathInput2 = useRef(null)
  const [privateKey, setPrivateKey] = useState(
    localStorage.getItem(STORAGE_KEYS.privateKey) || ''
  )
  const [publicKey, setPublicKey] = useState(
    localStorage.getItem(STORAGE_KEYS.publicKey) || ''
  )
  const [publicKeyDownloaded, setPublicKeyDownloaded] = useState(
    localStorage.getItem(STORAGE_KEYS.publicKeyDownloaded) || ''
  )
  const [username, setUsername] = useState(
    localStorage.getItem(STORAGE_KEYS.username) || ''
  )
  const [content, setContent] = useState(
    localStorage.getItem(STORAGE_KEYS.content) || ''
  )
  const [started, setStarted] = useState(
    localStorage.getItem(STORAGE_KEYS.started) || ''
  )
  const [submitted, setSubmitted] = useState(
    localStorage.getItem(STORAGE_KEYS.submitted) || ''
  )
  const [done, setDone] = useState(
    localStorage.getItem(STORAGE_KEYS.done) || ''
  )
  const [path, setPath] = useState(
    localStorage.getItem(STORAGE_KEYS.path) || ''
  )
  const [downloadedContent, setDownloadedContent] = useState(
    localStorage.getItem(STORAGE_KEYS.downloadedContent) || ''
  )
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const reset = () => {
    window.localStorage.clear()
    setPrivateKey('')
    setPublicKey('')
    setUsername('')
    setContent('')
    setPath('')
    setDownloadedContent('')
    setSubmitError('')
    setSubmitLoading(false)
    setPublicKeyDownloaded('')
    setStarted('')
    setSubmitted('')
    setDone('')
  }

  // const addNewPost = () => {
  //   setContent('')
  //   localStorage.removeItem(STORAGE_KEYS.content)
  //   setPath('')
  //   localStorage.removeItem(STORAGE_KEYS.path)
  //   setDownloadedContent('')
  //   localStorage.removeItem(STORAGE_KEYS.downloadedContent)
  //   setSubmitError('')
  //   setSubmitLoading(false)
  //   setSubmitted('')
  //   localStorage.removeItem(STORAGE_KEYS.submitted)
  // }

  const displayWriter = () => {
    window.localStorage.setItem(STORAGE_KEYS.done, 'true')
    setDone('true')
  }

  const generateKeys = () => {
    const EC = elliptic.ec
    var ec = new EC('secp256k1')
    var keys = ec.genKeyPair()
    const rawPrivateKey = keys.getPrivate('hex')
    const rawPublicKey = keys.getPublic('hex')
    window.localStorage.setItem(STORAGE_KEYS.publicKey, rawPublicKey)
    window.localStorage.setItem(STORAGE_KEYS.privateKey, rawPrivateKey)
    setPublicKey(rawPublicKey)
    setPrivateKey(rawPrivateKey)
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
    const rawPublicKey = publicKey
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
    localStorage.setItem(STORAGE_KEYS.publicKeyDownloaded, 'true')
    setPublicKeyDownloaded('true')
  }

  const submitPost = async (fullPath: string) => {
    setSubmitError('')
    setSubmitLoading(true)
    const postOwner = fullPath.split('/')[0]
    const postPath = fullPath.split('/').slice(1).join('/')

    // TODO: fetch data using backend
    const data = (await validatePath(postOwner, postPath))?.content
    if (!data && !submitError) {
      setSubmitError('Post not valid')
      setSubmitLoading(false)
      return
    }
    const hash = jsSha.sha256(data)
    const EC = elliptic.ec
    const ec = new EC('secp256k1')
    const key = ec.keyFromPrivate(
      localStorage.getItem(STORAGE_KEYS.privateKey)!,
      'hex'
    )
    const block = await Api().getLastBlock()
    console.log(block.hash)
    const blockHash = block.hash
    const signature = key.sign(
      jsSha.sha256([blockHash, postOwner, postPath, hash].join('/'))
    )
    const resp = await Api().submitPost(username, {
      domain: postOwner,
      path: postPath,
      blockHash,
      hash,
      signature: signature.toDER()
    })
    if (resp.error) {
      setSubmitError(resp.error)
    } else if (resp.success) {
      setSubmitError('')
      setSubmitted('true')
      localStorage.setItem(STORAGE_KEYS.submitted, 'true')
    }
    setSubmitLoading(false)
    console.log(resp)
    // console.log(hash)
    // // console.log(signature)
    // console.log(signature.toDER())
  }

  const renderDownloadKeys = () => {
    return (
      <div>
        <h3>
          {publicKeyDownloaded ? '✅ ' : ''} Step 2: Download public and private
          keys
        </h3>
        <button onClick={downloadPrivateKey}>Download private key</button>
        <button onClick={downloadPublicKey}>Download public key</button>
      </div>
    )
  }

  const renderGenerateKeys = () => {
    let buttons = <button onClick={generateKeys}>Generate keys</button>
    return (
      <div>
        <h3>
          {privateKey ? '✅ ' : ''} Step 1: Generate private and public keys
        </h3>
        {privateKey ? null : buttons}
      </div>
    )
  }

  const validatePath = async (domain: string, pathString: string) => {
    setSubmitLoading(true)
    if (!pathString) {
      setSubmitError('Please specify post path')
      setSubmitLoading(false)
      return
    }
    const response = await Api().validatePath(domain, pathString)
    if (response?.valid) {
      //TODO: display error message
      setSubmitError('')
    } else {
      setSubmitError(
        response.message ||
          'Post not found at path ' + ['http:/', domain, pathString].join('/')
      )
    }
    // TODO: set state loading: false to update state
    console.log(response)
    setSubmitLoading(false)
    console.log(response)
    return response
  }

  const validateDomain = async (domainName: string) => {
    domainName = domainName.trim()
    setSubmitLoading(true)
    if (!domainName) {
      setSubmitError('Please specify domain name, for example mydomain.com')
      setSubmitLoading(false)
      return
    }
    const response = await Api().validateKey(domainName, getPublicKeyPem())
    if (response?.valid) {
      localStorage.setItem(STORAGE_KEYS.username, domainName)
      setUsername(domainName)
      setSubmitError('')
    } else {
      setSubmitError(
        response?.message ||
          'Public key was not found at URL http://' + domainName + '/did.pem'
      )
    }
    // TODO: set state loading: false to update state
    console.log(response)
    setSubmitLoading(false)
  }

  const renderValidateDomain = () => {
    return (
      <div>
        <h3>
          {username ? '✅ ' : null}
          Step 3: Upload public key to a website that you own
        </h3>
        <p>
          By doing this you will prove that you are the owner of your domain
        </p>
        <div>
          http://
          <input
            ref={domainInput}
            disabled={!!username}
            placeholder="example.com"
            defaultValue={username}
          />
          /did.pem
          {username ? null : (
            <button
              disabled={submitLoading}
              onClick={() => {
                validateDomain((domainInput.current! as any).value)
              }}
            >
              {submitLoading ? 'Validating...' : 'Validate'}
            </button>
          )}
          {username && submitError ? null : (
            <p className="errorMessage">{submitError}</p>
          )}
        </div>
      </div>
    )
  }

  const downloadSocialPost = () => {
    const trimmedContent = content.trim()
    const escapedContent = escapeHTML(trimmedContent)
      .split('\n')
      .filter((p) => p)
    const rows = escapedContent.map((c) => {
      return `    <meta name="did:content" content="${c}">`
    })
    rows.push(`    <meta name="did:timestamp" content="${+new Date()}">`)
    // TODO attach image
    // <meta name="did:media" content="${url}">`
    // <meta name="did:media:hash" content="${imageHash}">`
    // <meta name="did:link" content="${url}">`
    // <meta name="did:link:hash" content="${pageHash}">` (could be DID page or regular link)
    // <meta name="did:location:lat" content="coords">`
    // <meta name="did:location:lng" content="coords">`
    const data = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${rows.join('\n')}
    <link rel="stylesheet" href="style.css">
    <title>${escapedContent[0].substring(0, 256)}</title>
  </head>
  <body>
    <div id="content">
      ${escapedContent.join('<br>\n      ')}
    </div>
  </body>
</html>

`
    const blob = new Blob([data])
    const a = window.document.createElement('a')
    a.href = window.URL.createObjectURL(blob)
    a.download = `index.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    localStorage.setItem(STORAGE_KEYS.downloadedContent, trimmedContent)
    localStorage.setItem(STORAGE_KEYS.postData, data)
    setDownloadedContent(trimmedContent)
  }

  const renderValidatePost = () => {
    const suggestedSlug = 'first-post'
    return (
      <div>
        <h3>
          {path ? '✅ ' : null} Step 5: Upload your social post to your
          validated domain
        </h3>
        <p>
          Create a folder on your domain and upload downloaded index.html to it.
          A good name for such folder could be <i>{suggestedSlug}</i>
        </p>
        {path ? null : (
          <p>
            If you want to change post content, you can still do it. Just change
            text and download the post again in the previous step. Make sure you
            upload correct post to your domain.
          </p>
        )}
        http://{username}/
        <input
          id="url"
          ref={pathInput}
          disabled={path ? true : false}
          defaultValue={path || suggestedSlug}
        />
        {path ? null : (
          <button
            disabled={submitLoading}
            onClick={async () => {
              const pathString = (pathInput.current! as any).value
              const resp = await validatePath(username, pathString)
              if (resp?.valid) {
                localStorage.setItem(STORAGE_KEYS.path, pathString)
                setPath(pathString)
              }
            }}
          >
            {submitLoading ? 'Checking...' : 'Check URL'}
          </button>
        )}
        {submitError && !path ? (
          <p className="errorMessage">{submitError}</p>
        ) : null}
      </div>
    )
  }

  const renderSumbitPost = () => {
    return (
      <div>
        <h3>
          {submitted ? '✅ ' : null} Step 6: Submit your signed post to DID node
        </h3>
        <p>
          Your submission will be signed automatically using your private key
        </p>
        {/* Node: {API_URL}
        <br /> */}
        {!submitted ? (
          <button onClick={() => submitPost(path)} disabled={submitLoading}>
            {submitLoading ? 'Submitting...' : 'Submit'}
          </button>
        ) : null}
        {submitError && !submitted ? (
          <p className="errorMessage">{submitError}</p>
        ) : (
          ''
        )}
      </div>
    )
  }

  const renderCongrats = () => {
    return (
      <div>
        <h3>
          {downloadedContent ? '✅ ' : null}Congrats! You have submitted a post
          to DID
        </h3>
        <p>
          Now you can{' '}
          <a href="http://tautvilas.lt" target="_blank">
            view your post
          </a>{' '}
          on a public reader platform.
        </p>
        <p>
          You can not only post your content, but also share DID links generated
          by other people. For this you can use unified writer interface
        </p>
        {done ? null : <button onClick={displayWriter}>Let's go!</button>}
      </div>
    )
  }

  const renderWriter = () => {
    return (
      <div>
        <h3>Write and publish your post or link on other domain</h3>
        <label htmlFor="post">Your post:</label>
        <br />
        <textarea
          style={{ minWidth: 400 }}
          onChange={(e) => {
            setContent(e.target.value.trim())
            localStorage.setItem(STORAGE_KEYS.content, e.target.value.trim())
          }}
        ></textarea>
        <br />
        {content.length > 10 ? (
          <button onClick={downloadSocialPost}>
            Download social post file
          </button>
        ) : (
          'Post content too short, please write something more :)'
        )}
        <br />
        http://
        <input ref={pathInput2} placeholder="Enter post URL" />
        <button
          disabled={submitLoading}
          onClick={() => submitPost((pathInput2.current! as any).value)}
        >
          {submitLoading ? 'Submitting...' : 'Submit'}
        </button>
        {submitError ? <p className="errorMessage">{submitError}</p> : null}
        View your submitted posts on Reader platform
      </div>
    )
  }

  const renderDownloadPost = () => {
    return (
      <div>
        <h3>
          {downloadedContent ? '✅ ' : null}Step 4: Write your post and download
          generated html file
        </h3>
        <label htmlFor="post">Your post:</label>
        <br />
        <textarea
          id="post"
          defaultValue={content}
          style={{ minWidth: 400 }}
          onChange={(e) => {
            setContent(e.target.value.trim())
            localStorage.setItem(STORAGE_KEYS.content, e.target.value.trim())
          }}
        ></textarea>
        <br />
        {content.length > 10 ? (
          <button onClick={downloadSocialPost}>
            Download social post file
          </button>
        ) : (
          'Post content too short, please write something more :)'
        )}
      </div>
    )
  }

  const renderStart = () => {
    return (
      <div>
        <h3>What is DID?</h3>
        <p>
          DID is <i>Decentralized Information Distribution</i> network, it
          aggregates social media post urls in a decentralized database. Each
          social post is stored on post owner domain and is published to DID
          network by signing it with private owner key. Are you ready to write
          your first post?
        </p>
        {started ? null : (
          <button
            onClick={() => {
              setStarted('true')
              localStorage.setItem(STORAGE_KEYS.started, 'true')
            }}
          >
            Let's get started!
          </button>
        )}
      </div>
    )
  }

  const steps = []
  if (done) {
    steps.push({
      id: 'writer',
      element: renderWriter
    })
  }
  if (submitted) {
    steps.push({
      id: 'congrats',
      element: renderCongrats
    })
  }
  if (path) {
    steps.push({
      id: 'submitPost',
      element: renderSumbitPost
    })
  }
  if (downloadedContent) {
    steps.push({
      id: 'validatePost',
      element: renderValidatePost
    })
  }
  if (username) {
    steps.push({
      id: 'post',
      element: renderDownloadPost
    })
  }
  if (publicKeyDownloaded) {
    steps.push({
      id: 'username',
      element: renderValidateDomain
    })
  }
  if (privateKey) {
    steps.push({
      id: 'download',
      element: renderDownloadKeys
    })
  }
  if (started) {
    steps.push({
      id: 'generate',
      element: renderGenerateKeys
    })
  }
  // if (!started) {
  steps.push({
    id: 'start',
    element: renderStart
  })
  // }

  return (
    <>
      <h1>Submit your first social post to DID</h1>
      <Flipper flipKey={steps.join('')}>
        {steps.map((step) => (
          <Flipped key={step.id} flipId={step.id}>
            <div className="step">{step.element()}</div>
          </Flipped>
        ))}
      </Flipper>
      <button onClick={reset}>Reset progress</button>
    </>
  )
}

export default App
