"use strict"

let timeout = null

// TODO: Make saving automatic on change.
// TODO: Reset to default button?

document.querySelectorAll('.field_modifiers input[type="checkbox"]')
.forEach(e => {
    e.addEventListener('change', () => {        
        updateModifierState()
    })
})

document.addEventListener('DOMContentLoaded', () => {
    browser.storage.local.get([
        'modifierAdd',
        'modifierScrollTo',
        'modifierCycle',
        'reverseCycle',
        'disableInInputs',

        'persist',
        'persistBlackList',

        'showMarkers',
        
        'markerBackgroundColor',
        'markerColor',
        'markerBackgroundColorActive',
        'markerColorActive',
        
        'markerWidth',
        'markerHeight',
        'markerPositionX',
        'markerPositionY',
        
        'updateMarkerDelay',

        'blacklist'
    ])
    .then(data => {
        // Keyboard shortcuts
        updateModifierCheckboxes(data, 'add', 'Add', 6)
        updateModifierCheckboxes(data, 'scroll_to', 'ScrollTo', 4)
        updateModifierCheckboxes(data, 'cycle', 'Cycle', 4)
        updateModifierCheckboxes(data, 'clear', 'Cycle', 4)
        updateModifierState()

        if ('reverseCycle' in data) {
            document.getElementById('reverse_cycle').checked = data.reverseCycle
        } else {
            document.getElementById('reverse_cycle').checked = false
        }

        if ('disableInInputs' in data) {
            document.getElementById('disable_in_inputs').checked = data.disableInInputs
        } else {
            document.getElementById('disable_in_inputs').checked = true
        }

        // Persist
        if ('persist' in data) {
            document.getElementById('persist').checked = data.persist
        } else {
            document.getElementById('persist').checked = true
        }

        document.getElementById('persist_blacklist').value = data.persistBlackList || 'facebook.com; reddit.com; twitter.com'

        // Markrs
        if ('showMarkers' in data) {
            document.getElementById('show_markers').checked = data.showMarkers
        } else {
            document.getElementById('show_markers').checked = true
        }
        
        document.getElementById('marker_background_color').value = data.markerBackgroundColor || '#FF6A00'
        document.getElementById('marker_color').value = data.markerColor || '#000000'            

        document.getElementById('marker_background_color_active').value = data.markerBackgroundColorActive || '#FFE000'
        document.getElementById('marker_color_active').value = data.markerColorActive || '#000000'


        document.getElementById('marker_width').value = data.markerWidth || 32
        document.getElementById('marker_height').value = data.markerHeight || 24
        
        if (data.markerPositionX === 'left') {
            document.getElementById('marker_position_x_left').checked = true
            document.getElementById('marker_position_x_right').checked = false
        } else {
            document.getElementById('marker_position_x_left').checked = false
            document.getElementById('marker_position_x_right').checked = true
        }

        if (data.markerPositionY === 'top') {
            document.getElementById('marker_position_y_top').checked = true
            document.getElementById('marker_position_y_bottom').checked = false
        } else {
            document.getElementById('marker_position_y_top').checked = false
            document.getElementById('marker_position_y_bottom').checked = true
        }

        document.getElementById('update_marker_delay').value = data.updateMarkerDelay || 500
        
        document.getElementById('blacklist').value = data.blacklist || 'youtube.com'
    })
})

document.querySelector('form').addEventListener('submit', e => {
    let addMod, scrollToMod, cycleMod, clearMod,
        posX, posY

    e.preventDefault()

    clearTimeout(timeout);
    document.querySelector('.message_success').classList.add('hidden')
    document.querySelectorAll('.message_error').forEach(e => {
        e.classList.add('hidden')
    })


    addMod = getModifiers('add')
    scrollToMod = getModifiers('scroll_to')

    if (addMod === scrollToMod) {
        document.querySelectorAll('.message_error').forEach(e => {
            e.classList.remove('hidden')
        })
        return
    }

    cycleMod = getModifiers('cycle')
    clearMod = getModifiers('clear')

    if (document.getElementById('marker_position_x_left').checked) {
        posX = 'left'
    } else {
        posX = 'right'
    }

    if (document.getElementById('marker_position_y_top').checked) {
        posY = 'top'
    } else {
        posY = 'bottom'
    }

    browser.storage.local.set({
        modifierAdd: addMod,
        modifierScrollTo: scrollToMod,
        modifierCycle: cycleMod,
        reverseCycle: document.getElementById('reverse_cycle').checked,     
        disableInInputs: document.getElementById('disable_in_inputs').checked,

        persist: document.getElementById('persist').checked,
        persistBlackList: document.getElementById('persist_blacklist').value,

        showMarkers: document.getElementById('show_markers').checked,
        
        markerBackgroundColor: document.getElementById('marker_background_color').value,
        markerColor: document.getElementById('marker_color').value,
        markerBackgroundColorActive: document.getElementById('marker_background_color_active').value,
        markerColorActive: document.getElementById('marker_color_active').value,
        
        markerWidth: document.getElementById('marker_width').value,
        markerHeight: document.getElementById('marker_height').value,
        markerPositionX: posX,
        markerPositionY: posY,
        
        updateMarkerDelay: document.getElementById('update_marker_delay').value,

        blacklist: document.getElementById('blacklist').value
    })
    .then(() => {
        document.querySelector('.message_success').classList.remove('hidden')

        timeout = setTimeout(() => { 
            document.querySelector('.message_success').classList.add('hidden')
        }, 1500)
    })
})

function getModifiers (name) {
    let modifier = 0;

    if (document.getElementById('modifier_' + name + '_ctrl').checked) {
        modifier |= 1
    }

    if (document.getElementById('modifier_' + name + '_shift').checked) {
        modifier |= 2
    }

    if (document.getElementById('modifier_' + name + '_alt').checked) {
        modifier |= 4
    }

    return modifier
}

function getModifierText (name) {
    let text = '';

    if (document.getElementById('modifier_' + name + '_ctrl').checked) {
        text += 'Ctrl + '
    }

    if (document.getElementById('modifier_' + name + '_shift').checked) {
        text += 'Shift + '
    }

    if (document.getElementById('modifier_' + name + '_alt').checked) {
        text += 'Alt + '
    }

    return text
}

function updateModifierCheckboxes(data, idName, keyName, modifiers) {
    if ('modifier' + keyName in data) {                
        modifiers = data['modifier' + keyName]
    }

    if ((modifiers | 1) === modifiers) {
        document.getElementById('modifier_' + idName + '_ctrl').checked = true
    } else {
        document.getElementById('modifier_' + idName + '_ctrl').checked = false
    }

    if ((modifiers | 2) === modifiers) {
        document.getElementById('modifier_' + idName + '_shift').checked = true
    } else {
        document.getElementById('modifier_' + idName + '_shift').checked = false
    }
    
    if ((modifiers | 4) === modifiers) {
        document.getElementById('modifier_' + idName + '_alt').checked = true
    } else {
        document.getElementById('modifier_' + idName + '_alt').checked = false
    }
}

function updateModifierState () {
    if (getModifiers('add') === getModifiers('scroll_to')) {
        document.querySelectorAll('.message_error').forEach(e => {
            e.classList.remove('hidden')
        })
    } else {
        document.querySelectorAll('.message_error').forEach(e => {
            e.classList.add('hidden')
        })
    }

    updateModifierText('add')
    updateModifierText('scroll_to')
    updateModifierText('cycle')
    updateModifierText('clear')
}

function updateModifierText (name) {
    let e = document.getElementById('modifiers_' + name + '_text'),
        children
        

    children = e.childNodes
    for (let i = 0; i < children.length; ++i) {
        e.removeChild(children[i])
    }

    e.appendChild(document.createTextNode(getModifierText(name)))
}
