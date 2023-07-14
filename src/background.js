'use strict'

/* global chrome */

import * as menu from './js/menu.js'
import * as message from './js/message.js'
import * as offscreen from './js/offscreen.js'
import * as storage from './js/storage.js'
import * as tabs from './js/tabs.js'
import * as uid from './js/uid.js'

chrome.runtime.onStartup.addListener(init)
chrome.runtime.onInstalled.addListener(init)
chrome.runtime.onMessage.addListener(onMessageReceived)
chrome.contextMenus.onClicked.addListener(onMenuClicked)

async function init (info) {
  try {
    await buildClipsMenu()

    if (info.reason === 'install') {
      await showOnboarding()
    }
  } catch (error) {
    handleError(error)
  }
}

async function showOnboarding () {
  try {
    const path = 'onboarding/html/welcome.html'
    const relativeUrl = chrome.runtime.getURL(path)

    await tabs.create(relativeUrl)
  } catch (error) {
    handleError(error)
  }
}

async function onMessageReceived (message) {
  if (message.target !== 'background') {
    return
  }

  if (message.type === 'add-clip') {
    try {
      await addClip(message.data)
      await buildClipsMenu()
    } catch (error) {
      handleError(error)
    }
  }
}

async function addClip (text) {
  try {
    const storedClips = await storage.load('clips', [])
    const clip = new Clip(text)
    storedClips.unshift(clip)

    const maxClips = 25

    if (storedClips.length > maxClips) {
      storedClips.splice(maxClips)
    }

    await storage.save('clips', storedClips)
  } catch (error) {
    handleError(error)
  }
}

class Clip {
  constructor (text) {
    const truncatedText = text.trim().split('\n')[0].substring(0, 40).trimEnd()
    this.title = truncatedText.length < text.length ? `${truncatedText}...` : truncatedText
    this.text = text
    this.uid = uid.create()
  }
}

async function buildClipsMenu () {
  try {
    const storedClips = await storage.load('clips', [])

    await menu.removeAll()

    if (storedClips.length === 0) {
      return
    }

    const menuItems = [
      {
        title: chrome.i18n.getMessage('CLIPBOARD'),
        id: 'parent',
        contexts: ['all'],
        type: 'normal'
      },
      ...storedClips.map((clip) => {
        return {
          title: clip.title,
          id: clip.uid,
          contexts: ['all'],
          type: 'normal',
          parentId: 'parent'
        }
      }),
      {
        id: 's1',
        contexts: ['all'],
        type: 'separator',
        parentId: 'parent'
      },
      {
        title: chrome.i18n.getMessage('CLEAR'),
        id: 'clear',
        contexts: ['all'],
        type: 'normal',
        parentId: 'parent'
      }
    ]

    await menu.create(menuItems)
  } catch (error) {
    handleError(error)
  }
}

async function onMenuClicked (info) {
  const { menuItemId } = info

  try {
    const storedClips = await storage.load('clips', [])

    if (menuItemId === 'clear') {
      console.log('clearing clips')
      await storage.clear('clips')
      await buildClipsMenu()
    } else {
      const foundClip = storedClips.find((clip) => clip.uid === menuItemId)

      if (!foundClip) {
        return
      }

      const documentPath = 'offscreen.html'
      const hasDocument = await offscreen.hasDocument(documentPath)

      if (!hasDocument) {
        await offscreen.create(documentPath)
      }

      message.sendSync({
        type: 'write-to-clipboard',
        target: 'offscreen',
        data: foundClip.text
      })
    }
  } catch (error) {
    handleError(error)
  }
}

function handleError (error) {
  console.error('An error occurred:', error)
}
