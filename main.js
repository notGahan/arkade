import { TIMING, COLORS } from './config.js';
import { appState, controlValues, visualState, resetHandState, animationState, toggleLanguage } from './state.js';
import { gotHands } from './gestures.js';
import { initAudio, playAudio, stopAudio } from './audio.js';
import { 
    drawWireframeSphere, 
    drawWireframeHourglass, 
    drawWireframePanning,
    drawWireframeWobbleCube,
    drawEqualizer, 
    drawHand, 
    Particle
} from './visuals.js';
import { startCalibration, drawCalibration } from './calibration.js';
import { updateUIForMode, handleKeyPress } from './ui.js';
import { drawRadialMenu, drawPinchDebugInfo, drawLongPressProgress } from './menu.js';
import { updateAllText } from './translator.js';

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('canvas-container');

    appState.video = createCapture(VIDEO);
    appState.video.size(640, 480);
    appState.video.hide();

    const initialMode = localStorage.getItem('arkade-initial-mode');
    if (initialMode) {
        appState.currentMode = initialMode;
        localStorage.removeItem('arkade-initial-mode');
        console.log('Starting with mode from onboarding:', initialMode);
    } else {
        appState.currentMode = 'volume';
    }

    initializeLanguage(); // Load saved language

    initializeMediaPipe();
    setupEventListeners();
    updateAllText(); // Initialize with current language
}

function initializeMediaPipe() {
    appState.hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    appState.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    appState.hands.onResults(gotHands);

    const camera = new Camera(appState.video.elt, {
        onFrame: async () => {
            await appState.hands.send({ image: appState.video.elt });
        },
        width: 640,
        height: 480
    });

    camera.start();

    setTimeout(() => {
        appState.isHandsReady = true;
    }, 2000);
}

function setupEventListeners() {
    document.getElementById('calibrate').addEventListener('click', startCalibration);
    document.getElementById('play-button').addEventListener('click', playAudio);
    document.getElementById('stop-button').addEventListener('click', stopAudio);
    document.getElementById('language-toggle').addEventListener('click', handleLanguageToggle);
}

function initializeLanguage() {
    const savedLanguage = localStorage.getItem('arkade-language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'it')) {
        appState.currentLanguage = savedLanguage;
        console.log(`Language loaded from localStorage: ${savedLanguage}`);
    } else {
        // Default to English and save it
        appState.currentLanguage = 'en';
        localStorage.setItem('arkade-language', 'en');
    }
}

function handleLanguageToggle() {
    toggleLanguage();
    localStorage.setItem('arkade-language', appState.currentLanguage);
    updateAllText();
    updateUIForMode(); // Refresh the current mode's UI
    console.log(`Language saved to localStorage: ${appState.currentLanguage}`);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    updateAnimations();
    background(10, 10, 10); 

    if (frameCount % 300 === 0) {
        console.log('p5.js is running - frameCount:', frameCount);
    }

    push();
    translate(-width / 2, -height / 2);

    push();
    translate(width, 0);
    scale(-1, 1);

    updateParticles();

    drawHandTrails();

    if (appState.currentLeftHand) {
        drawHand(appState.currentLeftHand, COLORS.LEFT_HAND, 255, false);
    }
    if (appState.currentRightHand) {
        drawHand(appState.currentRightHand, COLORS.RIGHT_HAND, 255, false);
        if (appState.menuPinchState) {
            drawLongPressProgress(appState.currentRightHand);
        }
    }

    if (appState.isCalibrating) {
        pop(); 
        drawCalibration();
        push(); 
        translate(width, 0);
        scale(-1, 1);
    }

    drawRadialMenu();

    pop(); 

    pop(); 

    draw3DVisuals();

    updateAudioParameters();

    checkHandTimeout();

    if (appState.lastLoggedMode !== appState.currentMode) {
        console.log('Current Mode:', appState.currentMode);
        appState.lastLoggedMode = appState.currentMode;
    }
}

function updateAnimations() {
    animationState.menu.radius.update();
    animationState.menu.alpha.update();
    Object.values(animationState.menu.items).forEach(item => {
        item.scale.update();
    });
    appState.handTrails.forEach(trail => trail.alphaSpring.update());

    animationState.visuals.sphere.size.update();
    animationState.visuals.hourglass.size.update();
    animationState.visuals.equalizer.low.size.update();
    animationState.visuals.equalizer.mid.size.update();
    animationState.visuals.equalizer.high.size.update();
    animationState.visuals.panning.position.update();
    animationState.visuals.wobbleCube.wobbleAmount.update();

    if (appState.isMenuOpen && animationState.menu.radius.target === 0 && animationState.menu.radius.isAtRest()) {
        appState.isMenuOpen = false;
        appState.menuCenterPosition = null;
        appState.selectedMode = null;
        appState.dragPosition = null;
        appState.longPressStartTime = null;
    }
}

function updateParticles() {
    for (let i = appState.particles.length - 1; i >= 0; i--) {
        appState.particles[i].update();
        appState.particles[i].display();
        if (appState.particles[i].isDead()) {
            appState.particles.splice(i, 1);
        }
    }
}

function drawHandTrails() {
    for (let i = 0; i < appState.handTrails.length; i++) {
        const trail = appState.handTrails[i];
        const alpha = trail.alphaSpring.getValue();

        if (alpha > 0.1 && trail.landmarks) {
            drawHand(trail.landmarks, trail.color, alpha, true);
        }
    }
}

function draw3DVisuals() {
    visualState.sphere.size = animationState.visuals.sphere.size.getValue();
    visualState.hourglass.size = animationState.visuals.hourglass.size.getValue();
    visualState.panning.panPosition = animationState.visuals.panning.position.getValue();

    if (appState.currentMode === 'volume') {
        drawWireframeSphere();
    } else if (appState.currentMode === 'reverb') {
        drawWireframeHourglass();
    } else if (appState.currentMode === 'panning') {
        drawWireframePanning();
    }
}

function updateAudioParameters() {
    if (appState.bothHandsPinching && abs(controlValues.volume.target - controlValues.volume.current) > 0.1) {
        controlValues.volume.current = lerp(controlValues.volume.current, controlValues.volume.target, 0.3);
    }
    
    if (appState.bothHandsPinching && abs(controlValues.reverb.target - controlValues.reverb.current) > 0.1) {
        controlValues.reverb.current = lerp(controlValues.reverb.current, controlValues.reverb.target, 0.3);
    }

    if (abs(controlValues.panning.target - controlValues.panning.current) > 0.1) {
        controlValues.panning.current = lerp(controlValues.panning.current, controlValues.panning.target, 0.3);
    }
}

function checkHandTimeout() {
    if (appState.isHandsReady && millis() - appState.lastDetectionTime > TIMING.TIMEOUT_DURATION) {
        resetHandState();
    }
}

function keyPressed() {
    const action = handleKeyPress(key);

        if (action === 'calibrate') {
        startCalibration();
    }
}

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.keyPressed = keyPressed;

window.onload = async () => {
    await initAudio();
    playAudio();
    updateUIForMode();
};