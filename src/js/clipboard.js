'use strict'

/* global chrome */

chrome.runtime.onMessage.addListener(onMessageReceived)

async function onMessageReceived (message) {
  if (message.target !== 'offscreen') {
    return
  }

  if (message.type === 'write-to-clipboard') {
    writeToClipboard(message.data)
  }
}

function writeToClipboard (data) {
  try {
    const textEl = document.getElementById('text')
    textEl.value = data
    textEl.select()
    document.execCommand('copy')
  } catch (error) {
    console.error('An error occurred:', error)
  } finally {
    window.close()
  }
}
