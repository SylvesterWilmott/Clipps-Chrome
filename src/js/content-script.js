'use strict'

/* global chrome */

document.addEventListener('copy', onCopy)

async function onCopy (e) {
  const sourceElement = e.srcElement
  const sourceElementTagName = sourceElement.tagName.toLowerCase()

  if (sourceElementTagName === 'input' && sourceElement.type === 'password') {
    return
  }

  const copiedText = window.getSelection().toString().trim()

  if (copiedText && copiedText.length) {
    chrome.runtime.sendMessage({ type: 'add-clip', target: 'background', data: copiedText })
  }
}
