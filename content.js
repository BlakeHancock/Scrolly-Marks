"use strict"

let EVENT_TYPE = 'keydown',
    STOP_PROPOGATION = true,
    SCROLLBAR_WIDTH = 0,

    MODIFIER_ADD = 6,
    MODIFIER_SCROLL_TO = 4,
    MODIFIER_CYCLE = 4,
    MODIFIER_CLEAR = 4,

    REVERSE_CYCLE = false,
    DISABLE_IN_INPUTS = true,    
    
    SHOW_MARKERS = true,
    MARKER_BACKGROUND_COLOR = '#FF6A00',
    MARKER_COLOR = '#000000',
    MARKER_BACKGROUND_COLOR_ACTIVE = '#FFE000',
    MARKER_COLOR_ACTIVE = '#000000',

    MARKER_WIDTH = 32,
    MARKER_HEIGHT = 24,
    MARKER_POSITION_X = 'right',
    MARKER_POSITION_Y = 'bottom',
    
    UPDATE_MARKER_DELAY = 500

let marks = {},
    keyCodes = {
        48: '0',
        49: '1',
        50: '2',
        51: '3',
        52: '4',
        53: '5',
        54: '6',
        55: '7',
        56: '8',
        57: '9'
    },
    upKeyCode = 38,
    downKeyCode = 40,
    delKeyCode = 46,
    active = null,
    url = window.location.toString()

browser.runtime.sendMessage({
    event: 'init', 
    url
})
.then(success => {
    if (success) {
        init()
    }
})

function init() {
    browser.storage.local.get([
        'modifierAdd',
        'modifierScrollTo',
        'modifierCycle',
        'reverseCycle',
        'disableInInputs',

        'showMarkers', 
        
        'markerBackgroundColor', 
        'markerColor',
        'markerBackgroundColorActive', 
        'markerColorActive',
        
        'markerWidth',
        'markerHeight',
        'markerPositionX',
        'markerPositionY',
        
        'updateMarkerDelay'
    ])
    .then(data => {
        // Keyboard shortcuts
        if ('modifierAdd' in data) {
            MODIFIER_ADD = data.modifierAdd
        }

        if ('modifierScrollTo' in data) {
            MODIFIER_SCROLL_TO = data.modifierScrollTo
        }

        if ('modifierCycle' in data) {
            MODIFIER_CYCLE = data.modifierCycle
        }

        if ('reverseCycle' in data) {
            REVERSE_CYCLE = data.reverseCycle
        }

        if ('disableInInputs' in data) {
            DISABLE_IN_INPUTS = data.disableInInputs
        }

        // Markers
        if ('showMarkers' in data) {
            SHOW_MARKERS = data.showMarkers
        } else {
            SHOW_MARKERS = true 
        }

        if ('markerBackgroundColor' in data) {
            MARKER_BACKGROUND_COLOR = data.markerBackgroundColor
        }

        if ('markerColor' in data) {
            MARKER_COLOR = data.markerColor
        }

        if ('markerBackgroundColorActive' in data) {
            MARKER_BACKGROUND_COLOR_ACTIVE = data.markerBackgroundColorActive
        }

        if ('markerColorActive' in data) {
            MARKER_COLOR_ACTIVE = data.markerColorActive
        }

        if ('markerWidth' in data) {
            MARKER_WIDTH = data.markerWidth
        }

        if ('markerHeight' in data) {
            MARKER_HEIGHT = data.markerHeight
        }

        if ('markerPositionX' in data) {
            MARKER_POSITION_X = data.markerPositionX
        }

        if ('markerPositionY' in data) {
            MARKER_POSITION_Y = data.markerPositionY
        }

        if ('updateMarkerDelay' in data) {
            UPDATE_MARKER_DELAY = data.updateMarkerDelay
        }

        SCROLLBAR_WIDTH = scrollbarWidth()

        return browser.runtime.sendMessage({
            event: 'load', 
            url
        })
    })
    .then(data => {
        marks = data
        updateMarkers()

        // Some sites modify things in ways that break markers
        // so we call it once more after a delay for those cases
        setTimeout(() => {
            updateMarkers()
        }, UPDATE_MARKER_DELAY);
        // TODO: Maybe iterate over 500 ms intervals?
    })

    // Just in case    
    let delay = () => {       
        document.removeEventListener('DOMContentLoaded', delay, false)
        setTimeout(() => {
            updateMarkers()
        }, UPDATE_MARKER_DELAY)
    }
    document.addEventListener('DOMContentLoaded', delay, false)

    document.addEventListener(EVENT_TYPE, e => {
        if (DISABLE_IN_INPUTS && isInputElement(e.target)) {
            return
        }

        let handled = false

        if (e.keyCode in keyCodes) {
            if (hasModifiers(e, MODIFIER_ADD)) {
                handled = true
                addMark(keyCodes[e.keyCode])
                updateMarkers() 
            } else if (hasModifiers(e, MODIFIER_SCROLL_TO)) {
                handled = true
                goToMark(keyCodes[e.keyCode])
            }
        }

        if (e.keyCode === upKeyCode && hasModifiers(e, MODIFIER_CYCLE)) {
            handled = true
            if (REVERSE_CYCLE) {
                goToNextMark()
            } else {
                goToPrevMark()
            }
        } else if (e.keyCode === downKeyCode && hasModifiers(e, MODIFIER_CYCLE)) {
            handled = true
            if (REVERSE_CYCLE) {
                goToPrevMark()
            } else {
                goToNextMark()
            }
        } else if (e.keyCode === delKeyCode && hasModifiers(e, MODIFIER_CLEAR)) {
            handled = true
            clearMarks()
            updateMarkers()
        }
            
        if (handled && STOP_PROPOGATION) {
            e.stopPropagation()
            e.preventDefault()
        }
    }, false)

    window.addEventListener('resize', () => {
        SCROLLBAR_WIDTH = scrollbarWidth()
        updateMarkers()
    }, false)
}

function hasModifiers(e, modifiers) {
    if ((modifiers | 1) === modifiers) {
        if (!e.ctrlKey) {
            return false
        }
    } else if (e.ctrlKey) {
        return false;
    }

    if ((modifiers | 2) === modifiers) {
        if (!e.shiftKey) {
            return false
        }
    } else if (e.shiftKey) {
        return false;
    }

    if ((modifiers | 4) === modifiers) {
        if (!e.altKey) {
            return false
        }
    } else if (e.altKey) {
        return false
    }

    return true
}

function addMark (index) {
    let mark = {},
        x = Math.round(window.scrollX),
        y = Math.round(window.scrollY)

    if (index in marks) {
        if (marks[index].x === x &&
            marks[index].y === y
        ) {
            delete marks[index]
            return
        }
    }

    mark.x = x
    mark.y = y

    marks[index] = mark

    browser.runtime.sendMessage({
        event: 'save',
        url,
        marks
    })
}

function clearMarks() {
    marks = {}
}

function goToMark (index) {
    if (index in marks) {
        active = index
        window.scrollTo(marks[index].x, marks[index].y)
        updateMarkers()
    }  
}
function goToNextMark () {
    let keys = Object.keys(marks)

    for (let i = 0; i < keys.length; ++i) {
        if (active === null) {
            goToMark(keys[i])
            return
        }

        if (keys[i] === active) {
            if (i === (keys.length - 1)) {
                i = 0
            } else {
                ++i
            }

            if (keys[i] !== active) {
                goToMark(keys[i])
            }
            return
        }
    }
}
function goToPrevMark () {
    let keys = Object.keys(marks)

    for (let i = 0; i < keys.length; ++i) {
        if (active === null) {
            goToMark(keys[i])
            return
        }

        if (keys[i] === active) {
            if (i === 0) {
                i = (keys.length - 1)
            } else {
                --i
            }
            
            if (keys[i] !== active) {
                goToMark(keys[i])
            }
            return
        }
    }
}

function isInputElement (target) {
    let element = target

    if (element.nodeType === 3) {
        element = element.parentNode
    }

    switch (element.tagName) {
        case 'INPUT':
        case 'TEXTAREA':
        case 'SELECT':
            return true
    }

    return false
}

function updateMarkers () {
    document.querySelectorAll('.scrolly-mark')
    .forEach(e => e.parentNode.removeChild(e))

    if (!SHOW_MARKERS) {
        return
    }

    let maxBodyX = (document.body.offsetWidth - window.innerWidth + scrollbarXOffset()),
        maxViewX = (window.innerWidth - scrollbarXOffset()),
        maxBodyY = (document.body.offsetHeight - window.innerHeight + scrollbarYOffset()),
        maxViewY = (window.innerHeight - scrollbarYOffset())        

    Object.keys(marks).forEach(index => {
        let mark = marks[index],
            markers = [],
            max, 
            min

        max = Math.max(MARKER_WIDTH, MARKER_HEIGHT)
        min = Math.min(MARKER_WIDTH, MARKER_HEIGHT)

        if (maxBodyX !== 0 && maxBodyY !== 0) {
            if (MARKER_POSITION_X === 'left' && MARKER_POSITION_Y === 'top') {
                if (min >= 16 && mark.x === 0 && mark.y === 0) {
                    markers.push({
                        x: 0,
                        y: 0,
                        w: max,
                        h: max
                    })
                }
            } else if (MARKER_POSITION_X === 'left' && MARKER_POSITION_Y === 'bottom') {
                if (min >= 16 && mark.x === 0 && mark.y === maxBodyY) {
                    markers.push({
                        x: 0,
                        y: Math.round((maxViewY - max) * mark.y / maxBodyY),
                        w: max,
                        h: max
                    })
                }
            } else if (MARKER_POSITION_X === 'right' && MARKER_POSITION_Y === 'top') {
                if (min >= 16 && mark.x === maxBodyX && mark.y === 0) {
                    markers.push({
                        x: Math.round((maxViewX - max) * mark.x / maxBodyX),
                        y: 0,
                        w: max,
                        h: max
                    })
                }
            } else if (MARKER_POSITION_X === 'right' && MARKER_POSITION_Y === 'bottom') {
                if (min >= 16 && mark.x === maxBodyX && mark.y === maxBodyY) {
                    markers.push({
                        x: Math.round((maxViewX - max) * mark.x / maxBodyX),
                        y: Math.round((maxViewY - max) * mark.y / maxBodyY),
                        w: max,
                        h: max
                    })
                }
            }
        }

        if (!markers.length) {
            if (mark.y === 0 && mark.x === 0) {
                markers.push({
                    x: 0,
                    y: 0,
                    w: MARKER_WIDTH,
                    h: MARKER_HEIGHT
                })
            } else {
                if (mark.y !== 0) {
                    markers.push({
                        x: 0,
                        y: Math.round((maxViewY - MARKER_HEIGHT) * mark.y / maxBodyY),
                        w: MARKER_WIDTH,
                        h: MARKER_HEIGHT
                    })
                }

                if (mark.x !== 0) {
                    markers.push({
                        x: Math.round((maxViewX - MARKER_HEIGHT) * mark.x / maxBodyX),
                        y: 0,
                        w: MARKER_WIDTH,
                        h: MARKER_HEIGHT
                    })
                }
            }
        }

        markers.forEach(marker => {
            let e = makeMarker(index, marker.x, marker.y, marker.w, marker.h)

            document.body.appendChild(e)
        })
    })
}
function makeMarker (index, x, y, w, h) {
    let e = document.createElement('div')
       
    e.appendChild(document.createTextNode(index))

    e.classList.add('scrolly-mark')
    
    e.style.position = 'fixed'
    // Only the highest of z-indexes
    e.style.zIndex = '2147483647'
    if (active === index) {
        e.style.backgroundColor = MARKER_BACKGROUND_COLOR_ACTIVE
        e.style.color = MARKER_COLOR_ACTIVE
    } else {
        e.style.backgroundColor = MARKER_BACKGROUND_COLOR
        e.style.color = MARKER_COLOR
    }
    e.style.textAlign = 'center'
    e.style.fontWeight = '700'
    e.style.fontSize = Math.max(16, Math.min(w, h, 20)) + 'px'
    e.style.cursor = 'pointer'
    e.style.overflow = 'hidden'
    e.style.boxSizing = 'border-box'    

    if (x === 0 && scrollbarXOffset()) {
        e.style.width = w + 'px'
        e.style.height = h + 'px'
        e.style.lineHeight = h + 'px'

        if (w < 16 || h < 16) {
            e.style.paddingLeft = w + 'px'
            e.style.paddingTtop = h + 'px'
        }    

        if (MARKER_POSITION_X === 'left') {
            e.style.left = '0'
        } else {
            e.style.right = '0'
        }

        let maxViewY = (window.innerHeight - h - scrollbarYOffset())  

        // If at last scroll position, align to bottom to fix any sub pixel
        // rendering issues that prevent it from touching the bottom
        if (y === maxViewY) {
            e.style.bottom = '0'
        } else {
            e.style.top = y + 'px'
        }
    } else { //if (y === 0) {
        let maxViewX

        e.style.width = h + 'px'
        e.style.height = w + 'px'
        e.style.lineHeight = w + 'px'   

        if (w < 16 || h < 16) {
            e.style.paddingLeft = h + 'px'
            e.style.paddingTtop = w + 'px'
        }    

        if (MARKER_POSITION_Y === 'top') {
            e.style.top = '0'
        } else {
            e.style.bottom = '0'
        }

        maxViewX = (window.innerWidth - h - scrollbarXOffset()) 
     
        if (x === maxViewX) {
            e.style.right = '0'
        } else {
            e.style.left = x + 'px'        
        }
    }

    e.addEventListener('click', () => goToMark(index), false)

    return e
}

function scrollbarYOffset() {
    if (document.body.offsetWidth > window.innerWidth) {
        return SCROLLBAR_WIDTH
    }

    return 0
}
function scrollbarXOffset() {
    if (document.body.offsetHeight > window.innerHeight) {
        return SCROLLBAR_WIDTH
    }

    return 0
}
function scrollbarWidth () {
    let inner, outer, w1, w2

    inner = document.createElement('div')
    inner.style.width = '100%'
    inner.style.height = '100%'

    outer = document.createElement('div')
    outer.style.position = 'absolute'
    outer.style.top = '0px'
    outer.style.left = '0px'
    outer.style.visibility = 'hidden'
    outer.style.width = '100px'
    outer.style.height = '100px'
    outer.style.overflow = 'hidden'

    outer.appendChild(inner)
    document.body.appendChild(outer)

    w1 = inner.offsetWidth
    outer.style.overflow = 'scroll'
    w2 = inner.offsetWidth

    if (w1 === w2) {
        w2 = outer.clientWidth
    }

    document.body.removeChild(outer)

    return (w1 - w2)
}