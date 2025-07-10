import { DEFAULTS, VISUAL } from './config.js';
import { Spring } from './physics.js';

export let appState = {
    video: null,
    hands: null,
    midiOutput: null,

    isHandsReady: false,
    lastDetectionTime: 0,
    handDataBuffer: [],
    currentLeftHand: null,
    currentRightHand: null,
    handTrails: [],

    bothHandsPinching: false,
    pinchStartDistance: null,
    lastValidDistance: null,

    thumbsUpState: false,
    lastThumbsUpState: false,
    lastThumbsUpTime: 0,

    leftHandPinchState: false,
    longPressStartTime: null,
    initialPinchTime: null,
    isMenuOpen: false,
    menuCenterPosition: null,
    selectedMode: null,
    dragPosition: null,

    currentMode: 'volume',
    currentLanguage: 'en',

    isCalibrating: false,
    calibrationValues: [],
    calibrationStartTime: null,
    minDistance: DEFAULTS.MIN_DISTANCE,
    maxDistance: DEFAULTS.MAX_DISTANCE,

    particles: [],

    handPositioningWarning: {
        isActive: false,
        leftHandTilted: false,
        rightHandTilted: false,
        severity: 'none', 
        showStartTime: null,
        hideStartTime: null
    }
};

export let animationState = {
    menu: {
        radius: new Spring(0, 0.3, 0.6),
        alpha: new Spring(0, 0.3, 0.6),
        items: {
            volume: { scale: new Spring(0, 0.3, 0.6) },
            reverb: { scale: new Spring(0, 0.3, 0.6) },
            equalizer: { scale: new Spring(0, 0.3, 0.6) },
            panning: { scale: new Spring(0, 0.3, 0.6) },
            wobble: { scale: new Spring(0, 0.3, 0.6) }
        }
    },
    visuals: {
        sphere: { size: new Spring(VISUAL.SPHERE.BASE_SIZE, 0.03, 0.6) },
        hourglass: { size: new Spring(VISUAL.HOURGLASS.BASE_SIZE, 0.03, 0.6) },
        equalizer: {
            low: { size: new Spring(100, 0.03, 0.6) },
            mid: { size: new Spring(100, 0.03, 0.6) },
            high: { size: new Spring(100, 0.03, 0.6) }
        },
        panning: { position: new Spring(0, 0.05, 0.7) },
        wobbleCube: { wobbleAmount: new Spring(0, 0.05, 0.7) }
    }
};

export let controlValues = {
    volume: {
        current: DEFAULTS.VOLUME,
        target: DEFAULTS.VOLUME,
        history: []
    },

    reverb: {
        current: DEFAULTS.REVERB,
        target: DEFAULTS.REVERB,
        history: []
    },

    panning: {
        current: DEFAULTS.PANNING,
        target: DEFAULTS.PANNING,
        history: []
    },

    equalizer: {
        low: { 
            current: DEFAULTS.EQ_LOW, 
            target: DEFAULTS.EQ_LOW, 
            history: []
        },
        mid: { 
            current: DEFAULTS.EQ_MID, 
            target: DEFAULTS.EQ_MID, 
            history: []
        },
        high: { 
            current: DEFAULTS.EQ_HIGH, 
            target: DEFAULTS.EQ_HIGH, 
            history: []
        }
    },

    wobble: {
        current: DEFAULTS.WOBBLE,
        target: DEFAULTS.WOBBLE,
        history: []
    }
};

export let visualState = {
    sphere: {
        rotation: 0,
        size: VISUAL.SPHERE.BASE_SIZE,
        targetSize: VISUAL.SPHERE.BASE_SIZE,
        elasticOvershoot: 0,
        elasticDecay: 0,
        elasticFrameCount: 0
    },

    hourglass: {
        rotation: 0,
        size: VISUAL.HOURGLASS.BASE_SIZE,
        targetSize: VISUAL.HOURGLASS.BASE_SIZE,
        elasticOvershoot: 0,
        elasticDecay: 0,
        elasticFrameCount: 0
    },

    panning: {
        panPosition: 0,
        targetPanPosition: 0,
        particles: []
    },

    equalizer: {
        rotation: 0,
        sizeLow: 100,
        sizeMid: 100,
        sizeHigh: 100,
        targetSizeLow: 100,
        targetSizeMid: 100,
        targetSizeHigh: 100,
        elasticOvershootLow: 0,
        elasticDecayLow: 0,
        elasticFrameCountLow: 0,
        elasticOvershootMid: 0,
        elasticDecayMid: 0,
        elasticFrameCountMid: 0,
        elasticOvershootHigh: 0,
        elasticDecayHigh: 0,
        elasticFrameCountHigh: 0
    },

    wobbleCube: {
        rotation: 0,
        wobbleAmount: 0,
        targetWobbleAmount: 0,
        elasticOvershoot: 0,
        elasticDecay: 0,
        elasticFrameCount: 0
    }
};

export function resetHandState() {
    appState.bothHandsPinching = false;
    appState.currentLeftHand = null;
    appState.currentRightHand = null;
    appState.handDataBuffer = [];
    appState.thumbsUpState = false;
    appState.lastThumbsUpState = false;
}

export function updateLastDetectionTime() {
    appState.lastDetectionTime = millis();
}

export function resetPanningParticles() {
    visualState.panning.particles = [];
}

export function openRadialMenu(centerPosition) {
    appState.isMenuOpen = true;
    appState.menuCenterPosition = centerPosition;
    appState.selectedMode = null;
    appState.dragPosition = null;

    animationState.menu.radius.setTarget(1);
    animationState.menu.alpha.setTarget(1);
    Object.values(animationState.menu.items).forEach((item, i) => {
        setTimeout(() => item.scale.setTarget(1), i * 50); 
    });
}

export function closeRadialMenu() {
    animationState.menu.radius.setTarget(0);
    animationState.menu.alpha.setTarget(0);
    Object.values(animationState.menu.items).forEach(item => item.scale.setTarget(0));
}

export function updateMenuDrag(position) {
    if (position && typeof position.x === 'number' && typeof position.y === 'number') {
        appState.dragPosition = position;
    }
}

export function selectModeFromMenu(mode) {
    if (mode && mode !== appState.currentMode) {
        appState.currentMode = mode;
        return true;
    }
    return false;
}

export function toggleLanguage() {
    appState.currentLanguage = appState.currentLanguage === 'en' ? 'it' : 'en';
    return appState.currentLanguage;
} 