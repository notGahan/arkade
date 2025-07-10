import { COLORS, TIMING, VISUAL } from './config.js';
import { drawHand } from './visuals.js';
import { Spring } from './physics.js';
import { getTranslation } from './translations.js';

const onboardingState = {
    hands: null,
    video: null,
    isHandsReady: false,
    currentLeftHand: null,
    currentRightHand: null,
    leftHandDetected: false,
    rightHandDetected: false,
    showingBothDetectedMessage: false,
    showingMenuInstructions: false,
    showingSelectionInstructions: false,
    menuInstructionTimeout: null,
    lottieAnimation: null,
    handDataBuffer: [],
    handTrails: [],

    isMenuOpen: false,
    menuCenterPosition: null,
    dragPosition: null,
    menuPinchState: false,
    initialPinchTime: null,
    longPressStartTime: null,
    selectedMode: null,
    menuCloseTimeout: null,
    currentLanguage: 'en',

    animationState: {
        menu: {
            radius: new Spring(0, 0.2, 0.7),
            alpha: new Spring(0, 0.2, 0.7),
            items: {
                volume: { scale: new Spring(1, 0.3, 0.95) },
                reverb: { scale: new Spring(1, 0.3, 0.95) },
                panning: { scale: new Spring(1, 0.3, 0.95) }
            }
        }
    }
};

window.appState = onboardingState;
window.animationState = onboardingState.animationState;

function analyzeHandOrientation(landmarks) {
    if (!landmarks || landmarks.length < 21) return { angle: 0, isWellPositioned: true };

    const wrist = landmarks[0];          
    const middleMCP = landmarks[9];      
    const indexMCP = landmarks[5];       

    const vector1 = {
        x: middleMCP.x - wrist.x,
        y: middleMCP.y - wrist.y,
        z: (middleMCP.z || 0) - (wrist.z || 0)
    };

        const vector2 = {
        x: indexMCP.x - wrist.x,
        y: indexMCP.y - wrist.y,
        z: (indexMCP.z || 0) - (wrist.z || 0)
    };

    const normal = {
        x: vector1.y * vector2.z - vector1.z * vector2.y,
        y: vector1.z * vector2.x - vector1.x * vector2.z,
        z: vector1.x * vector2.y - vector1.y * vector2.x
    };

    const normalMagnitude = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
    if (normalMagnitude === 0) return { angle: 0, isWellPositioned: true };

        normal.x /= normalMagnitude;
    normal.y /= normalMagnitude;
    normal.z /= normalMagnitude;

    const dotProduct = Math.abs(normal.z);
    const angle = Math.acos(Math.min(1, Math.max(-1, dotProduct))) * (180 / Math.PI);

    const TILT_THRESHOLD = 28;
    const isWellPositioned = angle < TILT_THRESHOLD;

        return { angle, isWellPositioned };
}

function updateOnboardingHandPositioningWarning(leftHandAnalysis, rightHandAnalysis) {
    const currentTime = millis();
    const SHOW_DELAY = 500; 
    const HIDE_DELAY = 1000; 

    if (!onboardingState.handPositioningWarning) {
        onboardingState.handPositioningWarning = {
            isActive: false,
            leftHandTilted: false,
            rightHandTilted: false,
            severity: 'none',
            showStartTime: null,
            hideStartTime: null
        };
    }

    const leftTilted = leftHandAnalysis && !leftHandAnalysis.isWellPositioned;
    const rightTilted = rightHandAnalysis && !rightHandAnalysis.isWellPositioned;
    const anyHandTilted = leftTilted || rightTilted;

    onboardingState.handPositioningWarning.leftHandTilted = leftTilted;
    onboardingState.handPositioningWarning.rightHandTilted = rightTilted;

    let severity = 'none';
    if (leftHandAnalysis && rightHandAnalysis) {
        if (leftTilted && rightTilted) {
            severity = 'severe';
        } else if (leftTilted || rightTilted) {
            severity = 'mild';
        }
    } else if (leftTilted || rightTilted) {
        severity = 'mild';
    }
    onboardingState.handPositioningWarning.severity = severity;

    if (anyHandTilted && !onboardingState.handPositioningWarning.isActive) {
        if (!onboardingState.handPositioningWarning.showStartTime) {
            onboardingState.handPositioningWarning.showStartTime = currentTime;
        } else if (currentTime - onboardingState.handPositioningWarning.showStartTime >= SHOW_DELAY) {
            onboardingState.handPositioningWarning.isActive = true;
            onboardingState.handPositioningWarning.hideStartTime = null;
        }
    } else if (!anyHandTilted && onboardingState.handPositioningWarning.isActive) {
        if (!onboardingState.handPositioningWarning.hideStartTime) {
            onboardingState.handPositioningWarning.hideStartTime = currentTime;
        } else if (currentTime - onboardingState.handPositioningWarning.hideStartTime >= HIDE_DELAY) {
            onboardingState.handPositioningWarning.isActive = false;
            onboardingState.handPositioningWarning.showStartTime = null;
        }
    } else if (anyHandTilted && onboardingState.handPositioningWarning.isActive) {
        onboardingState.handPositioningWarning.hideStartTime = null;
    } else if (!anyHandTilted && !onboardingState.handPositioningWarning.isActive) {
        onboardingState.handPositioningWarning.showStartTime = null;
    }

    updateOnboardingPositioningOverlay();
}

function updateOnboardingPositioningOverlay() {
    const overlay = document.getElementById('hand-positioning-overlay');
    if (!overlay) return;

    const suppressWarning = onboardingState.isMenuOpen || onboardingState.menuPinchState;

        if (onboardingState.handPositioningWarning && 
        onboardingState.handPositioningWarning.isActive && 
        !suppressWarning) {
        overlay.style.display = 'flex';

        const textElement = overlay.querySelector('.positioning-text');
        const subtextElement = overlay.querySelector('.positioning-subtext');

                if (textElement && subtextElement) {
            updateOnboardingPositioningText(
                onboardingState.handPositioningWarning.leftHandTilted,
                onboardingState.handPositioningWarning.rightHandTilted,
                onboardingState.handPositioningWarning.severity
            );
        }
    } else {
        overlay.style.display = 'none';
    }
}

function getPinchAmount(landmarks) {
    const thumb = landmarks[4];
    const index = landmarks[8];
    return dist(thumb.x, thumb.y, index.x, index.y);
}

function isFingersTouching(landmarks) {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const distance = dist(thumb.x, thumb.y, index.x, index.y);
    return distance < 0.035;
}

function drawRadialMenu() {
    const menuIsInactive = !onboardingState.isMenuOpen && onboardingState.animationState.menu.radius.isAtRest();

    if (menuIsInactive || !onboardingState.menuCenterPosition) {
        hideMenuOverlay();
        return;
    }

    showMenuOverlay();

    const centerX = onboardingState.menuCenterPosition.x;
    const centerY = onboardingState.menuCenterPosition.y;
    const baseRadius = 250;
    const currentRadius = baseRadius * onboardingState.animationState.menu.radius.getValue();
    const alpha = onboardingState.animationState.menu.alpha.getValue();

    if (alpha < 0.01) {
        return;
    }

    push();

    const volumeX = centerX;
    const volumeY = centerY - currentRadius;
    const spaceX = centerX + currentRadius * cos(radians(225));
    const spaceY = centerY + currentRadius * sin(radians(225));
    const directionX = centerX + currentRadius * cos(radians(135));
    const directionY = centerY + currentRadius * sin(radians(135));

    stroke(160, 160, 160, 180 * alpha);
    strokeWeight(2);
    line(centerX, centerY, volumeX, volumeY);
    line(centerX, centerY, spaceX, spaceY);
    line(centerX, centerY, directionX, directionY);

    fill(255, 255, 255, 255 * alpha);
    noStroke();
    ellipse(centerX, centerY, 30, 30);

    const selectedMode = getSelectedMode();

    updateMenuTextOverlay(volumeX, volumeY, spaceX, spaceY, directionX, directionY, selectedMode);

    if (onboardingState.dragPosition) {
        stroke(255, 255, 255, 120 * alpha);
        strokeWeight(2);
        line(centerX, centerY, onboardingState.dragPosition.x, onboardingState.dragPosition.y);
    }

    pop();
}

function drawLongPressProgress(hand) {
    if (!onboardingState.initialPinchTime) return;

    const pinchCenter = {
        x: (hand[4].x + hand[8].x) / 2 * width,
        y: (hand[4].y + hand[8].y) / 2 * height
    };

    const currentTime = millis();
    const elapsedTime = currentTime - onboardingState.initialPinchTime;
    const totalDuration = TIMING.MENU_OPEN_DELAY + TIMING.LONG_PRESS_DURATION;

    if (elapsedTime < 200) return;

    let progress = elapsedTime / totalDuration;
    progress = constrain(progress, 0, 1);

    if (progress <= 0 || onboardingState.isMenuOpen) return;

    push();
    translate(pinchCenter.x, pinchCenter.y);

        const outerRadius = 24;
    const innerRadius = 16;
    const strokeWidth = 4;

    push();

    noFill();
    stroke(255, 255, 255, 20);
    strokeWeight(strokeWidth);
    ellipse(0, 0, outerRadius * 2);

    noFill();
    stroke(255, 255, 255, 255);
    strokeWeight(strokeWidth);
    ellipse(0, 0, outerRadius * 2);

    if (progress > 0.01) {
        push();
        noStroke();

                if (progress < 0.5) {
            fill(255, 255, 255, 255);
            const fillAngle = map(progress, 0, 0.5, 0, PI);
            arc(0, 0, innerRadius * 2, innerRadius * 2, -PI/2, -PI/2 + fillAngle, PIE);

                    } else {
            fill(255, 255, 255, 255);

            arc(0, 0, innerRadius * 2, innerRadius * 2, -PI/2, PI/2, PIE);

            const leftFillAngle = map(progress, 0.5, 1, 0, PI);
            arc(0, 0, innerRadius * 2, innerRadius * 2, PI/2, PI/2 + leftFillAngle, PIE);
        }
        pop();
    }

    push();
    noStroke();
    fill(255, 255, 255, 200);
    textAlign(LEFT, CENTER);
    textSize(16);
    textStyle(NORMAL);

        let label = '';

        if (progress < 0.02) {
        push();
        rotate(-PI/2);
        fill(255, 255, 255, 255);
        triangle(0, -outerRadius - 3, -5, -outerRadius - 10, 5, -outerRadius - 10);
        pop();
        label = 'START';

            } else if (progress >= 0.48 && progress <= 0.52) {
        label = '50%';

            } else if (progress >= 0.98) {
        label = 'FULL';
    }

    if (label) {
        text(label, outerRadius + 15, 0);
    }

        pop();

        pop();
    pop();
}

function updateMenuTextOverlay(volumeX, volumeY, spaceX, spaceY, directionX, directionY, selectedMode) {
    const menuOverlay = document.getElementById('menu-overlay');
    const volumeText = document.getElementById('menu-text-volume');
    const spaceText = document.getElementById('menu-text-space');
    const directionText = document.getElementById('menu-text-direction');

    if (!menuOverlay || !volumeText || !spaceText || !directionText) return;

    menuOverlay.style.opacity = onboardingState.animationState.menu.alpha.getValue();

    const canvasContainer = document.getElementById('onboarding-canvas-container');
    const canvasRect = canvasContainer.getBoundingClientRect();

    const screenVolumeX = canvasRect.left + (width - volumeX);
    const screenVolumeY = canvasRect.top + volumeY;
    const screenSpaceX = canvasRect.left + (width - spaceX);
    const screenSpaceY = canvasRect.top + spaceY;
    const screenDirectionX = canvasRect.left + (width - directionX);
    const screenDirectionY = canvasRect.top + directionY;

    positionAndScaleText(volumeText, screenVolumeX, screenVolumeY, onboardingState.animationState.menu.items.volume.scale.getValue());
    positionAndScaleText(spaceText, screenSpaceX, screenSpaceY, onboardingState.animationState.menu.items.reverb.scale.getValue());
    positionAndScaleText(directionText, screenDirectionX, screenDirectionY, onboardingState.animationState.menu.items.panning.scale.getValue());

    updateTextStyling(volumeText, 'volume', selectedMode);
    updateTextStyling(spaceText, 'reverb', selectedMode);
    updateTextStyling(directionText, 'panning', selectedMode);
}

function positionAndScaleText(element, x, y, scale) {
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function updateTextStyling(textElement, mode, selectedMode) {
    textElement.className = 'menu-text';

    if (selectedMode === mode) {
        textElement.classList.add('selected');
    }
}

function hideMenuOverlay() {
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOverlay) {
        menuOverlay.style.opacity = 0;
        if (menuOverlay.style.display !== 'none') {
            setTimeout(() => {
                if (menuOverlay.style.opacity === '0') {
                    menuOverlay.style.display = 'none';
                }
            }, 300);
        }
    }
}

function showMenuOverlay() {
    const menuOverlay = document.getElementById('menu-overlay');
    if (menuOverlay) {
        menuOverlay.style.display = 'block';
    }
}

function getSelectedMode() {
    if (!onboardingState.dragPosition || !onboardingState.menuCenterPosition) return null;

    const dx = onboardingState.dragPosition.x - onboardingState.menuCenterPosition.x;
    const dy = onboardingState.dragPosition.y - onboardingState.menuCenterPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 80) return null;

    const angle = Math.atan2(dy, dx);
    let degrees = (angle * 180 / Math.PI + 360) % 360;

    if ((degrees >= 270 && degrees <= 360) || (degrees >= 0 && degrees <= 90)) {
        return 'volume'; // top half
    } else if (degrees >= 90 && degrees <= 180) {
        return 'panning'; // right (direction)
    } else if (degrees >= 180 && degrees <= 270) {
        return 'reverb'; // bottom-left (space)
    }

    return null;
}

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('onboarding-canvas-container');

    onboardingState.video = createCapture(VIDEO);
    onboardingState.video.size(640, 480);
    onboardingState.video.hide();

    initializeMediaPipe();
    setupEventListeners();
    initializeLanguage(); // Load saved language
    updateOnboardingText(); // Initialize with current language
}

function initializeMediaPipe() {
    onboardingState.hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    onboardingState.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    onboardingState.hands.onResults(gotHands);

    const camera = new Camera(onboardingState.video.elt, {
        onFrame: async () => {
            await onboardingState.hands.send({ image: onboardingState.video.elt });
        },
        width: 640,
        height: 480
    });

    camera.start();

    setTimeout(() => {
        onboardingState.isHandsReady = true;
    }, 2000);
}

function setupEventListeners() {
    const languageToggle = document.getElementById('onboarding-language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', handleLanguageToggle);
    }
}

function initializeLanguage() {
    const savedLanguage = localStorage.getItem('arkade-language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'it')) {
        onboardingState.currentLanguage = savedLanguage;
        console.log(`Language loaded from localStorage: ${savedLanguage}`);
    } else {
        // Default to English and save it
        onboardingState.currentLanguage = 'en';
        localStorage.setItem('arkade-language', 'en');
    }
}

function handleLanguageToggle() {
    onboardingState.currentLanguage = onboardingState.currentLanguage === 'en' ? 'it' : 'en';
    localStorage.setItem('arkade-language', onboardingState.currentLanguage);
    updateOnboardingText();
    console.log(`Language saved to localStorage: ${onboardingState.currentLanguage}`);
}

function updateOnboardingText() {
    const languageToggle = document.getElementById('onboarding-language-toggle');
    if (languageToggle) {
        languageToggle.textContent = getTranslation('language', onboardingState.currentLanguage);
    }
    
    const appTitle = document.querySelector('.onboarding-title');
    if (appTitle) {
        appTitle.textContent = getTranslation('appTitle', onboardingState.currentLanguage);
    }
    
    // Update menu text overlays
    const volumeText = document.getElementById('menu-text-volume');
    if (volumeText) volumeText.textContent = getTranslation('volume', onboardingState.currentLanguage);
    
    const spaceText = document.getElementById('menu-text-space');
    if (spaceText) spaceText.textContent = getTranslation('space', onboardingState.currentLanguage);
    
    const directionText = document.getElementById('menu-text-direction');
    if (directionText) directionText.textContent = getTranslation('direction', onboardingState.currentLanguage);
    
    // Update main onboarding instruction
    const onboardingText = document.getElementById('onboarding-text');
    if (onboardingText) onboardingText.textContent = getTranslation('showHandsToCamera', onboardingState.currentLanguage);
    
    // Update positioning overlay text
    const positioningText = document.querySelector('.positioning-text');
    if (positioningText) positioningText.textContent = getTranslation('keepHandsParallel', onboardingState.currentLanguage);
    
    const positioningSubtext = document.querySelector('.positioning-subtext');
    if (positioningSubtext) positioningSubtext.textContent = getTranslation('adjustHandAngle', onboardingState.currentLanguage);
}

function updateOnboardingPositioningText(leftTilted, rightTilted, severity) {
    const positioningText = document.querySelector('.positioning-text');
    const positioningSubtext = document.querySelector('.positioning-subtext');
    
    if (!positioningText || !positioningSubtext) return;
    
    if (severity === 'severe') {
        positioningText.textContent = getTranslation('keepBothHandsParallel', onboardingState.currentLanguage);
        positioningSubtext.textContent = getTranslation('adjustBothHands', onboardingState.currentLanguage);
    } else if (leftTilted) {
        positioningText.textContent = getTranslation('keepLeftHandParallel', onboardingState.currentLanguage);
        positioningSubtext.textContent = getTranslation('adjustLeftHand', onboardingState.currentLanguage);
    } else if (rightTilted) {
        positioningText.textContent = getTranslation('keepRightHandParallel', onboardingState.currentLanguage);
        positioningSubtext.textContent = getTranslation('adjustRightHand', onboardingState.currentLanguage);
    } else {
        positioningText.textContent = getTranslation('keepHandsParallel', onboardingState.currentLanguage);
        positioningSubtext.textContent = getTranslation('adjustHandAngle', onboardingState.currentLanguage);
    }
}

function gotHands(results) {
    if (!onboardingState.isHandsReady) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        onboardingState.handDataBuffer.push({
            landmarks: results.multiHandLandmarks,
            handedness: results.multiHandedness,
            timestamp: millis()
        });

        if (onboardingState.handDataBuffer.length > 5) {
            onboardingState.handDataBuffer.shift();
        }

        const stableData = getStableHandData();
        const handedness = results.multiHandedness;

        if (stableData && stableData.length > 0) {
            let detectedHands = [];

            if (onboardingState.menuCloseTimeout) {
                clearTimeout(onboardingState.menuCloseTimeout);
                onboardingState.menuCloseTimeout = null;
            }

            for (let i = 0; i < stableData.length && i < 2; i++) {
                const landmarks = stableData[i];
                const isLeft = handedness[i] && handedness[i].label === 'Left';

                detectedHands.push({
                    landmarks: landmarks,
                    isLeft: isLeft,
                    isPinching: isFingersTouching(landmarks),
                    pinchAmount: getPinchAmount(landmarks)
                });

                if (isLeft) {
                    onboardingState.currentLeftHand = landmarks;
                } else {
                    onboardingState.currentRightHand = landmarks;
                }

                if (frameCount % 12 === 0) {  
                    const color = isLeft ? COLORS.LEFT_HAND : COLORS.RIGHT_HAND;
                    const trail = {
                        landmarks: landmarks,
                        color: color,
                        time: millis(),
                        alphaSpring: new Spring(20, 0.05, 0.8)
                    };
                    onboardingState.handTrails.push(trail);
                    setTimeout(() => trail.alphaSpring.setTarget(0), 50);
                }
            }

            let leftHandAnalysis = null;
            let rightHandAnalysis = null;

                        for (const hand of detectedHands) {
                const analysis = analyzeHandOrientation(hand.landmarks);
                if (hand.isLeft) {
                    leftHandAnalysis = analysis;
                } else {
                    rightHandAnalysis = analysis;
                }
            }

            updateOnboardingHandPositioningWarning(leftHandAnalysis, rightHandAnalysis);

            const rightHand = detectedHands.find(h => !h.isLeft);
            if (rightHand) {
                processMenuGesture(rightHand);
            } else if (!onboardingState.isMenuOpen) {
                onboardingState.menuPinchState = false;
                onboardingState.longPressStartTime = null;
            }
        }

        updateOnboardingUI();
    } else {
        onboardingState.currentLeftHand = null;
        onboardingState.currentRightHand = null;
        onboardingState.handDataBuffer = [];

        if (onboardingState.handPositioningWarning) {
            onboardingState.handPositioningWarning.isActive = false;
            onboardingState.handPositioningWarning.leftHandTilted = false;
            onboardingState.handPositioningWarning.rightHandTilted = false;
            onboardingState.handPositioningWarning.severity = 'none';
            onboardingState.handPositioningWarning.showStartTime = null;
            onboardingState.handPositioningWarning.hideStartTime = null;
            updateOnboardingPositioningOverlay();
        }

        if (onboardingState.isMenuOpen && !onboardingState.menuCloseTimeout) {
            onboardingState.menuCloseTimeout = setTimeout(() => {
                if (onboardingState.isMenuOpen) {
                    closeRadialMenu();
                }
                onboardingState.menuPinchState = false;
                onboardingState.longPressStartTime = null;
                onboardingState.menuCloseTimeout = null;
            }, 500); 
        } else if (!onboardingState.isMenuOpen) {
            onboardingState.menuPinchState = false;
            onboardingState.longPressStartTime = null;
        }

                updateOnboardingUI();
    }
}

function processMenuGesture(hand) {
    if (!hand || !hand.landmarks || !hand.landmarks.length) return;

        const currentPinch = hand.isPinching;
    const currentTime = millis();

        if (currentPinch && !onboardingState.menuPinchState) {
        onboardingState.menuPinchState = true;
        onboardingState.initialPinchTime = currentTime;
        onboardingState.longPressStartTime = null;
    } else if (!currentPinch && onboardingState.menuPinchState) {
        onboardingState.menuPinchState = false;
        onboardingState.initialPinchTime = null;
        onboardingState.longPressStartTime = null;
        if (onboardingState.isMenuOpen) {
            const selectedMode = getSelectedMode();
            if (selectedMode) {
                console.log(`Selected mode: ${selectedMode}`);
                highlightSelectedMode(selectedMode);
                setTimeout(() => {
                    closeRadialMenu();
                    localStorage.setItem('arkade-initial-mode', selectedMode);
                    setTimeout(() => {
                        completeOnboarding();
                    }, 300); 
                }, 200);
            } else {
                setTimeout(() => {
                    closeRadialMenu();
                }, 200);
            }
        }
    } else if (currentPinch && onboardingState.menuPinchState) {
        if (!onboardingState.longPressStartTime && onboardingState.initialPinchTime && 
            (currentTime - onboardingState.initialPinchTime) >= TIMING.MENU_OPEN_DELAY) {
            onboardingState.longPressStartTime = currentTime;
        }
        if (!onboardingState.isMenuOpen && onboardingState.longPressStartTime && 
            (currentTime - onboardingState.longPressStartTime) >= TIMING.LONG_PRESS_DURATION) {
            const pinchCenter = {
                x: (hand.landmarks[4].x + hand.landmarks[8].x) / 2 * width,
                y: (hand.landmarks[4].y + hand.landmarks[8].y) / 2 * height
            };
            openRadialMenu(pinchCenter);
        } else if (onboardingState.isMenuOpen) {
            const dragPos = {
                x: (hand.landmarks[4].x + hand.landmarks[8].x) / 2 * width,
                y: (hand.landmarks[4].y + hand.landmarks[8].y) / 2 * height
            };
            onboardingState.dragPosition = dragPos;

            updateMenuItemScaling();
        }
    }
}

function highlightSelectedMode(selectedMode) {
    if (onboardingState.animationState.menu.items[selectedMode]) {
        onboardingState.animationState.menu.items[selectedMode].scale.setTarget(1.2);
        setTimeout(() => {
            onboardingState.animationState.menu.items[selectedMode].scale.setTarget(1);
        }, 150);
    }
}

function updateMenuItemScaling() {
    const selectedMode = getSelectedMode();

    Object.keys(onboardingState.animationState.menu.items).forEach(mode => {
        if (mode === selectedMode) {
            onboardingState.animationState.menu.items[mode].scale.setTarget(1.1);
        } else {
            onboardingState.animationState.menu.items[mode].scale.setTarget(1);
        }
    });
}

function showSelectionInstructions() {
    onboardingState.showingSelectionInstructions = true;
    const handsContainer = document.querySelector('.onboarding-hands');
    const onboardingText = document.getElementById('onboarding-text');

        if (handsContainer) {
        handsContainer.innerHTML = '<div id="lottie-container" class="hand-icon lottie-instruction"></div>';

        const lottieContainer = document.getElementById('lottie-container');
        if (lottieContainer && window.lottie) {
            onboardingState.lottieAnimation = window.lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'assets/select.json'
            });
        }
    }

        if (onboardingText) {
        onboardingText.textContent = getTranslation('dragToSelectEffect', onboardingState.currentLanguage);
    }
}

function openRadialMenu(position) {
    onboardingState.isMenuOpen = true;
    onboardingState.menuCenterPosition = position;
    onboardingState.selectedMode = null;
    onboardingState.dragPosition = null;

    onboardingState.animationState.menu.radius.setTarget(1);
    onboardingState.animationState.menu.alpha.setTarget(1);

    showSelectionInstructions();
}

function closeRadialMenu() {
    onboardingState.animationState.menu.radius.setTarget(0);
    onboardingState.animationState.menu.alpha.setTarget(0);

    Object.values(onboardingState.animationState.menu.items).forEach(item => {
        item.scale.setTarget(1);
    });
}

function getStableHandData() {
    if (onboardingState.handDataBuffer.length === 0) return null;

    const latestHands = onboardingState.handDataBuffer[onboardingState.handDataBuffer.length - 1];
    const numHands = latestHands.handedness.length;
    const stableHands = [];

    for (let h = 0; h < numHands; h++) {
        const latestHandType = latestHands.handedness[h].label;
        const stableLandmarks = [];

        for (let i = 0; i < 21; i++) {
            let avgX = 0, avgY = 0, avgZ = 0;
            let count = 0;

            for (let b = 0; b < onboardingState.handDataBuffer.length; b++) {
                const bufferEntry = onboardingState.handDataBuffer[b];
                const handIndex = bufferEntry.handedness.findIndex(hand => hand.label === latestHandType);

                if (handIndex !== -1 && bufferEntry.landmarks[handIndex] && bufferEntry.landmarks[handIndex][i]) {
                    avgX += bufferEntry.landmarks[handIndex][i].x;
                    avgY += bufferEntry.landmarks[handIndex][i].y;
                    avgZ += bufferEntry.landmarks[handIndex][i].z || 0;
                    count++;
                }
            }

            if (count > 0) {
                stableLandmarks.push({ x: avgX / count, y: avgY / count, z: avgZ / count });
            }
        }

        if (stableLandmarks.length === 21) {
            stableHands.push(stableLandmarks);
        }
    }

    return stableHands;
}

function updateOnboardingUI() {
    const leftHandIcon = document.getElementById('left-hand-icon');
    const rightHandIcon = document.getElementById('right-hand-icon');
    const onboardingText = document.getElementById('onboarding-text');
    const handsContainer = document.querySelector('.onboarding-hands');

    if (onboardingState.currentRightHand && !onboardingState.leftHandDetected) {
        onboardingState.leftHandDetected = true;
        leftHandIcon?.classList.add('detected');
    } else if (!onboardingState.currentRightHand && onboardingState.leftHandDetected) {
        onboardingState.leftHandDetected = false;
        leftHandIcon?.classList.remove('detected');
    }

    if (onboardingState.currentLeftHand && !onboardingState.rightHandDetected) {
        onboardingState.rightHandDetected = true;
        rightHandIcon?.classList.add('detected');
    } else if (!onboardingState.currentLeftHand && onboardingState.rightHandDetected) {
        onboardingState.rightHandDetected = false;
        rightHandIcon?.classList.remove('detected');
    }

    if (onboardingState.leftHandDetected && onboardingState.rightHandDetected) {
        if (!onboardingState.showingBothDetectedMessage) {
            onboardingState.showingBothDetectedMessage = true;
            onboardingText.textContent = getTranslation('bothHandsDetected', onboardingState.currentLanguage);
            onboardingText.classList.add('success');

            onboardingState.menuInstructionTimeout = setTimeout(() => {
                onboardingState.showingMenuInstructions = true;

                if (handsContainer) {
                    handsContainer.innerHTML = '<div class="hand-icon left-instruction"><img src="assets/left.svg" alt="Right hand gesture"></div>';
                }

                onboardingText.textContent = getTranslation('pinchHoldForMenu', onboardingState.currentLanguage);
            }, 1000);
        }
    } else {
        if (onboardingState.menuInstructionTimeout) {
            clearTimeout(onboardingState.menuInstructionTimeout);
            onboardingState.menuInstructionTimeout = null;
        }

        if (onboardingState.showingBothDetectedMessage || onboardingState.showingMenuInstructions || onboardingState.showingSelectionInstructions) {
            onboardingState.showingBothDetectedMessage = false;
            onboardingState.showingMenuInstructions = false;
            onboardingState.showingSelectionInstructions = false;
            onboardingText.textContent = getTranslation('showHandsToCamera', onboardingState.currentLanguage);
            onboardingText.classList.remove('success');

            if (onboardingState.lottieAnimation) {
                onboardingState.lottieAnimation.destroy();
                onboardingState.lottieAnimation = null;
            }

            if (handsContainer) {
                handsContainer.innerHTML = `
                    <div id="left-hand-icon" class="hand-icon left-hand">
                        <img src="assets/left-palm.svg" alt="Left hand">
                    </div>
                    <div id="right-hand-icon" class="hand-icon right-hand">
                        <img src="assets/right-palm.svg" alt="Right hand">
                    </div>
                `;
            }
        }
    }
}

function updateAnimations() {
    onboardingState.animationState.menu.radius.update();
    onboardingState.animationState.menu.alpha.update();
    Object.values(onboardingState.animationState.menu.items).forEach(item => {
        item.scale.update();
    });
    onboardingState.handTrails.forEach(trail => trail.alphaSpring.update());

    if (onboardingState.isMenuOpen && 
        onboardingState.animationState.menu.radius.target === 0 && 
        onboardingState.animationState.menu.radius.isAtRest()) {
        onboardingState.isMenuOpen = false;
        onboardingState.menuCenterPosition = null;
        onboardingState.selectedMode = null;
        onboardingState.dragPosition = null;
        onboardingState.longPressStartTime = null;
    }
}

function draw() {
    updateAnimations();
    background(10, 10, 10);

    push();
    translate(width, 0);
    scale(-1, 1);

    onboardingState.handTrails = onboardingState.handTrails.filter(
        t => !t.alphaSpring.isAtRest() || t.alphaSpring.getValue() > 0
    );

    for (let i = 0; i < onboardingState.handTrails.length; i++) {
        const trail = onboardingState.handTrails[i];
        const alpha = trail.alphaSpring.getValue();

        if (alpha > 0.1 && trail.landmarks) {
            drawHand(trail.landmarks, trail.color, alpha, true);
        }
    }

    if (onboardingState.currentLeftHand) {
        if (isFingersTouching(onboardingState.currentLeftHand)) {
            const leftThumb = { x: onboardingState.currentLeftHand[4].x * width, y: onboardingState.currentLeftHand[4].y * height };
            const leftIndex = { x: onboardingState.currentLeftHand[8].x * width, y: onboardingState.currentLeftHand[8].y * height };
            drawPinchGlow(leftThumb, leftIndex, COLORS.LEFT_HAND, 255);
        }
        drawHand(onboardingState.currentLeftHand, COLORS.LEFT_HAND, 255, false);
    }
    if (onboardingState.currentRightHand) {
        if (isFingersTouching(onboardingState.currentRightHand)) {
            const rightThumb = { x: onboardingState.currentRightHand[4].x * width, y: onboardingState.currentRightHand[4].y * height };
            const rightIndex = { x: onboardingState.currentRightHand[8].x * width, y: onboardingState.currentRightHand[8].y * height };
            drawPinchGlow(rightThumb, rightIndex, COLORS.RIGHT_HAND, 255);
        }
        drawHand(onboardingState.currentRightHand, COLORS.RIGHT_HAND, 255, false);
        if (onboardingState.menuPinchState) {
            drawLongPressProgress(onboardingState.currentRightHand);
        }
    }

    drawRadialMenu();

    pop();
}

function drawPinchGlow(thumbTip, indexTip, color, baseAlpha) {
    push();

        const centerX = (thumbTip.x + indexTip.x) / 2;
    const centerY = (thumbTip.y + indexTip.y) / 2;
    const pulseAmount = sin(millis() * 0.006) * 0.2 + 0.8;

    noStroke();

    const glowLayers = [
        { size: 100, alpha: 0.05 },
        { size: 70, alpha: 0.08 },
        { size: 45, alpha: 0.15 },
        { size: 30, alpha: 0.25 }
    ];

    for (const layer of glowLayers) {
        const size = layer.size * pulseAmount;
        const alpha = layer.alpha * (baseAlpha / 255);
        fill(color.r, color.g, color.b, alpha * 255);
        ellipse(centerX, centerY, size, size);
    }

    fill(255, 255, 255, baseAlpha * 0.7 * pulseAmount);
    ellipse(centerX, centerY, 12 * pulseAmount, 12 * pulseAmount);

    pop();
}

function completeOnboarding() {
    // Ensure language preference is saved before navigation
    localStorage.setItem('arkade-language', onboardingState.currentLanguage);
    console.log(`Language persisted before navigation: ${onboardingState.currentLanguage}`);
    window.location.href = 'main.html';
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized; 