"use strict"

browser.runtime.onMessage.addListener(notify)

function notify (message) {
    switch (message.event) {
        case 'init':
            return init(message.url)
        case 'load':
            return load(message.url)
        case 'save':
            return save(message.url, message.marks)
    }
}

function init (url) {
    url = url.toLowerCase()

    return browser.storage.local.get('blacklist')
    .then(data => {
        let blacklist = data.blacklist || 'youtube.com'
        
        if (isBlacklistMatch(url, blacklist)) {
            return false
        }

        return true
    })
}

function load (url) {
    url = url.toLowerCase()

    return browser.storage.local.get(['persist', 'persistBlacklist', url])
    .then(data => {
        return persist(url, data)
        .then(persist => {
            if (persist && url in data) {
                return data[url]
            }
            
            return {}
        })
    })
}

function save (url, marks) {
    url = url.toLowerCase()

    return browser.storage.local.get(['persist', 'persistBlacklist'])
    .then(data => persist(url, data))
    .then(persist => {
        if (persist) {
            let data = {}
            data[url] = marks

            return browser.storage.local.set(data)
        }
    })
}

function persist(url, data) {    
    if ('persist' in data && !data.persist) {
        return Promise.resolve(false)
    }

    url = url.toLowerCase()

    let blacklist = data.persistBlacklist || 'facebook.com;reddit.com;twitter.com'

    if (isBlacklistMatch(url, blacklist)) {        
        return browser.storage.local.remove(url)
        .then(() => {
            return Promise.resolve(false)
        })
        .catch(e => {
            return Promise.resolve(false)
        })
    }

    return Promise.resolve(true)
}

function isBlacklistMatch (url, blacklist) {
    blacklist = blacklist.split(';')

    for (let value of blacklist) {
        value = value.trim().toLowerCase()

        if (url.indexOf(value) >= 0) {
            return true
        }
    }

    return false
}