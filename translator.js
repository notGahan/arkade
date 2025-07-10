import { getTranslation } from './translations.js';
import { appState } from './state.js';

export function t(key) {
    return getTranslation(key, appState.currentLanguage);
}

export function updateAllText() {
    // Update static text elements
    updateStaticText();
    
    // Update mode-specific text
    updateModeText();
    
    // Update instruction text
    updateInstructionText();
    
    // Update positioning text
    updatePositioningText();
    
    // Update control buttons
    updateControlButtons();
    
    // Update language toggle button
    updateLanguageToggle();
    
    console.log(`Language switched to: ${appState.currentLanguage}`);
}

function updateStaticText() {
    // Update app title
    const appTitle = document.querySelector('.app-title');
    if (appTitle) {
        appTitle.textContent = t('appTitle');
    }
    
    // Update mode cards labels
    const volumeLabel = document.querySelector('#volume-card .card-label');
    if (volumeLabel) volumeLabel.textContent = t('volume');
    
    const spaceLabel = document.querySelector('#space-card .card-label');
    if (spaceLabel) spaceLabel.textContent = t('space');
    
    const directionLabel = document.querySelector('#direction-card .card-label');
    if (directionLabel) directionLabel.textContent = t('direction');
    
    const wobbleLabel = document.querySelector('#wobble-card .card-label');
    if (wobbleLabel) wobbleLabel.textContent = t('wobble');
    
    // Update equalizer labels
    const highLabel = document.querySelector('#equalizer-cards .eq-card:nth-child(1) .card-label');
    if (highLabel) highLabel.textContent = t('high');
    
    const midLabel = document.querySelector('#equalizer-cards .eq-card:nth-child(2) .card-label');
    if (midLabel) midLabel.textContent = t('mid');
    
    const lowLabel = document.querySelector('#equalizer-cards .eq-card:nth-child(3) .card-label');
    if (lowLabel) lowLabel.textContent = t('low');
    
    // Update panning labels
    const panningLeft = document.querySelector('.panning-label-left');
    if (panningLeft) panningLeft.textContent = t('panningLeft');
    
    const panningCenter = document.querySelector('.panning-label-center');
    if (panningCenter) panningCenter.textContent = t('panningCenter');
    
    const panningRight = document.querySelector('.panning-label-right');
    if (panningRight) panningRight.textContent = t('panningRight');
}

function updateModeText() {
    // Update menu text overlays
    const volumeText = document.getElementById('menu-text-volume');
    if (volumeText) volumeText.textContent = t('volume');
    
    const spaceText = document.getElementById('menu-text-space');
    if (spaceText) spaceText.textContent = t('space');
    
    const wobbleText = document.getElementById('menu-text-wobble');
    if (wobbleText) wobbleText.textContent = t('wobble');
    
    const balanceText = document.getElementById('menu-text-balance');
    if (balanceText) balanceText.textContent = t('balance');
    
    const directionText = document.getElementById('menu-text-direction');
    if (directionText) directionText.textContent = t('direction');
}

function updateInstructionText() {
    // Update main instruction cards
    const volumeInstruction = document.querySelector('#volume-instruction-card .onboarding-text');
    if (volumeInstruction) volumeInstruction.textContent = t('pinchSpreadVolume');
    
    const spaceyInstruction = document.querySelector('#spacey-instruction-card .onboarding-text');
    if (spaceyInstruction) spaceyInstruction.textContent = t('pinchSpreadSpace');
    
    const directionInstruction = document.querySelector('#direction-instruction-card .onboarding-text');
    if (directionInstruction) directionInstruction.textContent = t('pointDirection');
    
    const wobbleInstruction = document.querySelector('#wobble-instruction-card .onboarding-text');
    if (wobbleInstruction) wobbleInstruction.textContent = t('pinchSpreadWobble');
    
    // Update balance instruction cards
    const balanceLowInstruction = document.querySelector('#balance-instruction-cards .onboarding-card-small:nth-child(1) .onboarding-text-small');
    if (balanceLowInstruction) balanceLowInstruction.textContent = t('low');
    
    const balanceMidInstruction = document.querySelector('#balance-instruction-cards .onboarding-card-small:nth-child(2) .onboarding-text-small');
    if (balanceMidInstruction) balanceMidInstruction.textContent = t('mid');
    
    const balanceHighInstruction = document.querySelector('#balance-instruction-cards .onboarding-card-small:nth-child(3) .onboarding-text-small');
    if (balanceHighInstruction) balanceHighInstruction.textContent = t('high');
    
    // Update menu instructions
    const menuInstructions = document.querySelectorAll('.instruction-text');
    menuInstructions.forEach(instruction => {
        if (instruction.textContent.includes('PINCH AND HOLD') || instruction.textContent.includes('PIZZICA E TIENI')) {
            instruction.textContent = t('pinchHoldMenu');
        }
    });
}

function updatePositioningText() {
    const positioningText = document.querySelector('.positioning-text');
    const positioningSubtext = document.querySelector('.positioning-subtext');
    
    if (positioningText && positioningSubtext) {
        // This will be updated dynamically based on hand positioning state
        positioningText.textContent = t('keepHandsParallel');
        positioningSubtext.textContent = t('adjustHandAngle');
    }
}

function updateControlButtons() {
    const connectMidi = document.getElementById('connect-midi');
    if (connectMidi) {
        if (connectMidi.textContent.includes('CONNECT') || connectMidi.textContent.includes('CONNETTI')) {
            connectMidi.textContent = t('connectMidi');
        } else {
            connectMidi.textContent = t('disconnectMidi');
        }
    }
    
    const playButton = document.getElementById('play-button');
    if (playButton) playButton.textContent = t('play');
    
    const stopButton = document.getElementById('stop-button');
    if (stopButton) stopButton.textContent = t('stop');
    
    const calibrateButton = document.getElementById('calibrate');
    if (calibrateButton) calibrateButton.textContent = t('calibrate');
}

function updateLanguageToggle() {
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.textContent = t('language');
    }
}

// Function to update positioning text dynamically based on hand state
export function updatePositioningTextForHands(leftTilted, rightTilted, severity) {
    const positioningText = document.querySelector('.positioning-text');
    const positioningSubtext = document.querySelector('.positioning-subtext');
    
    if (!positioningText || !positioningSubtext) return;
    
    if (severity === 'severe') {
        positioningText.textContent = t('keepBothHandsParallel');
        positioningSubtext.textContent = t('adjustBothHands');
    } else if (leftTilted) {
        positioningText.textContent = t('keepLeftHandParallel');
        positioningSubtext.textContent = t('adjustLeftHand');
    } else if (rightTilted) {
        positioningText.textContent = t('keepRightHandParallel');
        positioningSubtext.textContent = t('adjustRightHand');
    } else {
        positioningText.textContent = t('keepHandsParallel');
        positioningSubtext.textContent = t('adjustHandAngle');
    }
}