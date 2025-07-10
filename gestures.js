import { DETECTION_THRESHOLDS, TIMING } from './config.js';
import { appState, controlValues, updateLastDetectionTime, openRadialMenu, closeRadialMenu, updateMenuDrag, selectModeFromMenu } from './state.js';
import { processVolume, processReverb, updatePanningValue } from './audio.js';
import { switchMode, updateUIForMode, updateCurrentModeCard } from './ui.js';
import { updatePositioningTextForHands } from './translator.js';
import { Spring } from './physics.js';

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

    const cameraZ = { x: 0, y: 0, z: 1 };

    const dotProduct = Math.abs(normal.z); 
    const angle = Math.acos(Math.min(1, Math.max(-1, dotProduct))) * (180 / Math.PI);

    const TILT_THRESHOLD = 28; 
    const isWellPositioned = angle < TILT_THRESHOLD;

        return { angle, isWellPositioned };
}

function updateHandPositioningWarning(leftHandAnalysis, rightHandAnalysis) {
    const currentTime = millis();
    const SHOW_DELAY = 500; 
    const HIDE_DELAY = 1000; 

    const leftTilted = leftHandAnalysis && !leftHandAnalysis.isWellPositioned;
    const rightTilted = rightHandAnalysis && !rightHandAnalysis.isWellPositioned;
    const anyHandTilted = leftTilted || rightTilted;

    appState.handPositioningWarning.leftHandTilted = leftTilted;
    appState.handPositioningWarning.rightHandTilted = rightTilted;

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
    appState.handPositioningWarning.severity = severity;

    if (anyHandTilted && !appState.handPositioningWarning.isActive) {
        if (!appState.handPositioningWarning.showStartTime) {
            appState.handPositioningWarning.showStartTime = currentTime;
        } else if (currentTime - appState.handPositioningWarning.showStartTime >= SHOW_DELAY) {
            appState.handPositioningWarning.isActive = true;
            appState.handPositioningWarning.hideStartTime = null;
        }
    } else if (!anyHandTilted && appState.handPositioningWarning.isActive) {
        if (!appState.handPositioningWarning.hideStartTime) {
            appState.handPositioningWarning.hideStartTime = currentTime;
        } else if (currentTime - appState.handPositioningWarning.hideStartTime >= HIDE_DELAY) {
            appState.handPositioningWarning.isActive = false;
            appState.handPositioningWarning.showStartTime = null;
        }
    } else if (anyHandTilted && appState.handPositioningWarning.isActive) {
        appState.handPositioningWarning.hideStartTime = null;
    } else if (!anyHandTilted && !appState.handPositioningWarning.isActive) {
        appState.handPositioningWarning.showStartTime = null;
    }

    updatePositioningOverlay();
}

function updatePositioningOverlay() {
    const overlay = document.getElementById('hand-positioning-overlay');
    if (!overlay) return;

    const suppressWarning = appState.bothHandsPinching || appState.isMenuOpen; 

        if (appState.handPositioningWarning.isActive && !suppressWarning) {
        overlay.style.display = 'flex';

        const textElement = overlay.querySelector('.positioning-text');
        const subtextElement = overlay.querySelector('.positioning-subtext');

                if (textElement && subtextElement) {
            updatePositioningTextForHands(
                appState.handPositioningWarning.leftHandTilted,
                appState.handPositioningWarning.rightHandTilted,
                appState.handPositioningWarning.severity
            );
        }
    } else {
        overlay.style.display = 'none';
    }
}

export function gotHands(results) {
    if (!appState.isHandsReady) return;

    appState.handTrails = appState.handTrails.filter(t => !t.alphaSpring.isAtRest() || t.alphaSpring.getValue() > 0);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        updateLastDetectionTime();

        appState.handDataBuffer.push({
            landmarks: results.multiHandLandmarks,
            handedness: results.multiHandedness,
            timestamp: millis()
        });

        if (appState.handDataBuffer.length > TIMING.BUFFER_SIZE) {
            appState.handDataBuffer.shift();
        }

        const stableData = getStableHandData();
        const handedness = results.multiHandedness;

        if (stableData && stableData.length > 0) {
            let detectedHands = [];

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
                    appState.currentLeftHand = landmarks;
                } else {
                    appState.currentRightHand = landmarks;
                }

                const trailFrequency = 3;
                if (frameCount % trailFrequency === 0) {
                    const color = isLeft ? { r: 147, g: 51, b: 234 } : { r: 236, g: 72, b: 153 };
                    const trail = {
                        landmarks: landmarks,
                        color: color,
                        time: millis(),
                        alphaSpring: new Spring(20, 0.05, 0.8)
                    };
                    appState.handTrails.push(trail);
                    setTimeout(() => trail.alphaSpring.setTarget(0), 50);
                }
            }

            const rightHand = detectedHands.find(h => !h.isLeft);
            if (rightHand && !appState.bothHandsPinching) {
                processMenuGesture(rightHand);
            } else {
                appState.menuPinchState = false;
                appState.longPressStartTime = null;
                if (appState.isMenuOpen) {
                    closeRadialMenu();
                }
            }

            if (!appState.isMenuOpen) {
                const leftHand = detectedHands.find(h => h.isLeft);
                if (leftHand) {
                    processThumbsUpGesture(leftHand);
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

            updateHandPositioningWarning(leftHandAnalysis, rightHandAnalysis);

            if (appState.currentMode === 'volume') {
                processVolumeGestures(detectedHands);
            } else if (appState.currentMode === 'reverb') {
                processReverbGestures(detectedHands);
            } else if (appState.currentMode === 'panning') {
                processPanningGestures(detectedHands);
            }

            if (detectedHands.length === 1) {
                if (detectedHands[0].isLeft) {
                    appState.currentRightHand = null;
                } else {
                    appState.currentLeftHand = null;
                }
            }
        }
    } else {
        appState.bothHandsPinching = false;
        appState.currentLeftHand = null;
        appState.currentRightHand = null;
        appState.handDataBuffer = [];

        appState.thumbsUpState = false;
        appState.lastThumbsUpState = false;

        appState.leftHandPinchState = false;
        appState.longPressStartTime = null;
        if (appState.isMenuOpen) {
            closeRadialMenu();
        }

        appState.handPositioningWarning.isActive = false;
        appState.handPositioningWarning.leftHandTilted = false;
        appState.handPositioningWarning.rightHandTilted = false;
        appState.handPositioningWarning.severity = 'none';
        appState.handPositioningWarning.showStartTime = null;
        appState.handPositioningWarning.hideStartTime = null;
        updatePositioningOverlay();

    }
}

function processVolumeGestures(detectedHands) {
    processGestureMode(detectedHands, processVolume);
}

function processReverbGestures(detectedHands) {
    processGestureMode(detectedHands, processReverb);
}

function processPanningGestures(detectedHands) {
    const controlHand = detectedHands.find(h => h.isLeft); // Use left hand for panning

    if (controlHand) {
        const indexFingerTip = controlHand.landmarks[8];

        const screenXNormalized = 1.0 - indexFingerTip.x;

        const sliderStart = 0.10;
        const sliderEnd = 0.90;

        let panValue = map(screenXNormalized, sliderStart, sliderEnd, 0, 127);

        const sliderPixelStart = sliderStart * width;
        const sliderPixelEnd = sliderEnd * width;
        const sliderPixelCenter = (sliderPixelStart + sliderPixelEnd) / 2;
        const fingerPixelX = screenXNormalized * width;

        const magnetRadius = 20;
        if (Math.abs(fingerPixelX - sliderPixelCenter) <= magnetRadius) {
            panValue = 64;
        } else {
            panValue = constrain(panValue, 0, 127);
        }

        updatePanningValue(panValue);

        appState.isPanningActive = true;
    } else {
        appState.isPanningActive = false;
    }

    updateCurrentModeCard();
}

function processGestureMode(detectedHands, processor) {
    if (detectedHands.length === 2) {
        const hand1 = detectedHands[0];
        const hand2 = detectedHands[1];

        if (hand1.isPinching && hand2.isPinching) {
            if (!appState.bothHandsPinching) {
                appState.bothHandsPinching = true;
                appState.pinchStartDistance = getHandsDistance(hand1.landmarks, hand2.landmarks);
            }

            const distance = getHandsDistance(hand1.landmarks, hand2.landmarks);
            appState.lastValidDistance = distance;
            processor(distance);

        } else {
            appState.bothHandsPinching = false;
            appState.pinchStartDistance = null;
        }
    } else {
        appState.bothHandsPinching = false;
    }
}

function processThumbsUpGesture(hand) {
    const currentThumbsUp = detectThumbsUp(hand.landmarks);
    appState.lastThumbsUpState = appState.thumbsUpState;
    appState.thumbsUpState = currentThumbsUp;

    const thumbsUpDetected = !appState.lastThumbsUpState && appState.thumbsUpState;
    const currentTime = millis();

    if (thumbsUpDetected && currentTime - appState.lastThumbsUpTime > TIMING.GESTURE_COOLDOWN) {
        handleThumbsUp();
        appState.lastThumbsUpTime = currentTime + TIMING.GESTURE_COOLDOWN;
    }
}

function detectThumbsUp(landmarks, isStrict = false) {
    if (!landmarks || landmarks.length < 21) return false;

    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3]; 
    const thumbMCP = landmarks[2]; 

        const indexMCP = landmarks[5];
    const indexTip = landmarks[8];
    const middleMCP = landmarks[9];
    const middleTip = landmarks[12];
    const ringMCP = landmarks[13];
    const ringTip = landmarks[16];
    const pinkyMCP = landmarks[17];
    const pinkyTip = landmarks[20];

    const indexClosed = indexTip.y > indexMCP.y;
    const middleClosed = middleTip.y > middleMCP.y;
    const ringClosed = ringTip.y > ringMCP.y;
    const pinkyClosed = pinkyTip.y > pinkyMCP.y;
    const closedFingersCount = [indexClosed, middleClosed, ringClosed, pinkyClosed].filter(Boolean).length;

    const requiredClosedCount = isStrict ? 4 : 3;
    if (closedFingersCount < requiredClosedCount) return false;

    const vec1 = { x: thumbIP.x - thumbMCP.x, y: thumbIP.y - thumbMCP.y };
    const vec2 = { x: thumbTip.x - thumbIP.x, y: thumbTip.y - thumbIP.y };
    const dotProduct = vec1.x * vec2.x + vec1.y * vec2.y;
    const mag1 = Math.sqrt(vec1.x * vec1.x + vec1.y * vec1.y);
    const mag2 = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y);
    const angle = Math.acos(dotProduct / (mag1 * mag2)); 

        const isThumbStraight = angle < 0.75; 
    if (!isThumbStraight) return false;

    const verticalDist = Math.abs(thumbTip.y - thumbMCP.y);
    const horizontalDist = Math.abs(thumbTip.x - thumbMCP.x);

    const uprightRatio = isStrict ? 2.0 : 1.2;
    const isThumbUpright = verticalDist > horizontalDist * uprightRatio;

    return isThumbUpright;
}

function handleThumbsUp() {
    
}

function getStableHandData() {
    if (appState.handDataBuffer.length === 0) return null;

    if (appState.handDataBuffer.length < TIMING.BUFFER_SIZE) {
        const lastEntry = appState.handDataBuffer[appState.handDataBuffer.length - 1];
        return lastEntry.landmarks;
    }

    const latestHands = appState.handDataBuffer[appState.handDataBuffer.length - 1];
    const numHands = latestHands.handedness.length;
    const stableHands = [];

    for (let h = 0; h < numHands; h++) {
        const latestHandType = latestHands.handedness[h].label;
        const stableLandmarks = [];

        for (let i = 0; i < 21; i++) {
            let weightedX = 0, weightedY = 0, weightedZ = 0;
            let totalWeight = 0;

            for (let b = 0; b < appState.handDataBuffer.length; b++) {
                const bufferEntry = appState.handDataBuffer[b];
                const handIndex = bufferEntry.handedness.findIndex(hand => hand.label === latestHandType);

                if (handIndex !== -1 && bufferEntry.landmarks[handIndex] && bufferEntry.landmarks[handIndex][i]) {
                    const weight = Math.pow(2, b); 
                    const landmark = bufferEntry.landmarks[handIndex][i];

                                        weightedX += landmark.x * weight;
                    weightedY += landmark.y * weight;
                    weightedZ += (landmark.z || 0) * weight;
                    totalWeight += weight;
                }
            }

            if (totalWeight > 0) {
                stableLandmarks.push({ 
                    x: weightedX / totalWeight, 
                    y: weightedY / totalWeight, 
                    z: weightedZ / totalWeight 
                });
            }
        }

        if (stableLandmarks.length === 21) {
            stableHands.push(stableLandmarks);
        }
    }

    return stableHands;
}

export function getPinchAmount(landmarks) {
    const thumb = landmarks[4];
    const index = landmarks[8];
    return dist(thumb.x, thumb.y, index.x, index.y);
}

export function isFingersTouching(landmarks) {
    const thumb = landmarks[4];
    const index = landmarks[8];

    const distance = dist(thumb.x, thumb.y, index.x, index.y);

    const handScale = calculateHandScale(landmarks);

    const baseThreshold = 0.02;
    const scaledThreshold = baseThreshold * handScale;

    const thumbZ = thumb.z || 0;
    const indexZ = index.z || 0;
    const depthDistance = Math.abs(thumbZ - indexZ);

    const depthAlignmentBonus = depthDistance < 0.02 ? 1.2 : 1.0;
    const finalThreshold = scaledThreshold * depthAlignmentBonus;

    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3]; 
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6]; 

    const tipDistance = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y);
    const crossDistance1 = dist(thumbTip.x, thumbTip.y, indexPIP.x, indexPIP.y);
    const crossDistance2 = dist(thumbIP.x, thumbIP.y, indexTip.x, indexTip.y);

    const minDistance = Math.min(tipDistance, crossDistance1, crossDistance2);

    return minDistance < finalThreshold;
}

export function getHandsDistance(landmarks1, landmarks2) {
    const center1 = {
        x: (landmarks1[4].x + landmarks1[8].x) / 2,
        y: (landmarks1[4].y + landmarks1[8].y) / 2,
        z: ((landmarks1[4].z || 0) + (landmarks1[8].z || 0)) / 2
    };
    const center2 = {
        x: (landmarks2[4].x + landmarks2[8].x) / 2,
        y: (landmarks2[4].y + landmarks2[8].y) / 2,
        z: ((landmarks2[4].z || 0) + (landmarks2[8].z || 0)) / 2
    };

    const distance2D = dist(center1.x * width, center1.y * height,
        center2.x * width, center2.y * height);

    const depthDifference = Math.abs(center1.z - center2.z) * width; 

    const distance3D = Math.sqrt(distance2D * distance2D + depthDifference * depthDifference);

        return distance3D;
}

function processMenuGesture(hand) {
    if (!hand || !hand.landmarks || !hand.landmarks.length) return;

        const currentPinch = hand.isPinching;
    const currentTime = millis();

        if (currentPinch && !appState.menuPinchState) {
        appState.menuPinchState = true;
        appState.initialPinchTime = currentTime;
        appState.longPressStartTime = null;
    } else if (!currentPinch && appState.menuPinchState) {
        appState.menuPinchState = false;
        appState.initialPinchTime = null;
        appState.longPressStartTime = null;
        if (appState.isMenuOpen) {
            const selectedMode = getSelectedModeFromDrag();
            if (selectedMode) {
                if (selectModeFromMenu(selectedMode)) {
                    updateUIForMode();
                }
            }
            closeRadialMenu();
        }
    } else if (currentPinch && appState.menuPinchState) {
        if (!appState.longPressStartTime && appState.initialPinchTime && (currentTime - appState.initialPinchTime) >= TIMING.MENU_OPEN_DELAY) {
            appState.longPressStartTime = currentTime;
        }
        if (!appState.isMenuOpen && appState.longPressStartTime && 
            (currentTime - appState.longPressStartTime) >= TIMING.LONG_PRESS_DURATION) {
            try {
                const pinchCenter = {
                    x: (hand.landmarks[4].x + hand.landmarks[8].x) / 2 * width,
                    y: (hand.landmarks[4].y + hand.landmarks[8].y) / 2 * height
                };
                openRadialMenu(pinchCenter);
            } catch (error) {
                console.log('Menu opening error:', error);
            }
        } else if (appState.isMenuOpen) {
            try {
                const dragPos = {
                    x: (hand.landmarks[4].x + hand.landmarks[8].x) / 2 * width,
                    y: (hand.landmarks[4].y + hand.landmarks[8].y) / 2 * height
                };
                updateMenuDrag(dragPos);
            } catch (error) {
                console.log('Drag update error:', error);
            }
        }
    }
}

function getSelectedModeFromDrag() {
    if (!appState.dragPosition || !appState.menuCenterPosition) return null;

    const dx = appState.dragPosition.x - appState.menuCenterPosition.x;
    const dy = appState.dragPosition.y - appState.menuCenterPosition.y;
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

function calculateHandScale(landmarks) {
    if (!landmarks || landmarks.length < 21) return 1.0;

    const wrist = landmarks[0];
    const middleFingerTip = landmarks[12];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const pinkyTip = landmarks[20];

    const handLength = dist(wrist.x, wrist.y, middleFingerTip.x, middleFingerTip.y);
    const thumbToIndex = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y);
    const handWidth = dist(thumbTip.x, thumbTip.y, pinkyTip.x, pinkyTip.y);

    const avgHandLength = 0.15;
    const avgThumbToIndex = 0.08;
    const avgHandWidth = 0.12;

    const lengthScale = handLength / avgHandLength;
    const thumbIndexScale = thumbToIndex / avgThumbToIndex;
    const widthScale = handWidth / avgHandWidth;

    const handScale = (lengthScale * 0.4 + widthScale * 0.4 + thumbIndexScale * 0.2);

    return constrain(handScale, 0.4, 2.5);
} 