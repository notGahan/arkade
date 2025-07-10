import { COLORS, VISUAL, TIMING } from './config.js';
import { appState, controlValues, animationState } from './state.js';

export function drawRadialMenu() {
    const menuIsInactive = !appState.isMenuOpen && animationState.menu.radius.isAtRest();

        if (menuIsInactive || !appState.menuCenterPosition) {
        hideMenuOverlay();
        return;
    }

        showMenuOverlay();

    const centerX = appState.menuCenterPosition.x;
    const centerY = appState.menuCenterPosition.y;
    const baseRadius = 250;
    const currentRadius = baseRadius * animationState.menu.radius.getValue();
    const alpha = animationState.menu.alpha.getValue();

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

    if (appState.dragPosition) {
        stroke(255, 255, 255, 120 * alpha);
        strokeWeight(2);
        line(centerX, centerY, appState.dragPosition.x, appState.dragPosition.y);
    }

        pop();
}

export function drawLongPressProgress(hand) {
    if (!appState.initialPinchTime) return;

    const pinchCenter = {
        x: (hand[4].x + hand[8].x) / 2 * width,
        y: (hand[4].y + hand[8].y) / 2 * height
    };

    const currentTime = millis();
    const elapsedTime = currentTime - appState.initialPinchTime;
    const totalDuration = TIMING.MENU_OPEN_DELAY + TIMING.LONG_PRESS_DURATION;

    if (elapsedTime < 200) return;

    let progress = elapsedTime / totalDuration;
    progress = constrain(progress, 0, 1);

    if (progress <= 0 || appState.isMenuOpen) return;

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

    menuOverlay.style.opacity = animationState.menu.alpha.getValue();

    const canvasContainer = document.getElementById('canvas-container');
    const canvasRect = canvasContainer.getBoundingClientRect();

    const screenVolumeX = canvasRect.left + (width - volumeX);
    const screenVolumeY = canvasRect.top + volumeY;
    const screenSpaceX = canvasRect.left + (width - spaceX);
    const screenSpaceY = canvasRect.top + spaceY;
    const screenDirectionX = canvasRect.left + (width - directionX);
    const screenDirectionY = canvasRect.top + directionY;

    positionAndScaleText(volumeText, screenVolumeX, screenVolumeY, animationState.menu.items.volume.scale.getValue());
    positionAndScaleText(spaceText, screenSpaceX, screenSpaceY, animationState.menu.items.reverb.scale.getValue());
    positionAndScaleText(directionText, screenDirectionX, screenDirectionY, animationState.menu.items.panning.scale.getValue());

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
    } else if (appState.currentMode === mode) {
        textElement.classList.add('current-mode');
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

export function drawDebugCrosshair(x, y) {
    push();
    stroke(255, 0, 0, 200);
    strokeWeight(1);
    line(x - 10, y, x + 10, y);
    line(x, y - 10, x, y + 10);
    pop();
}

export function drawPinchDebugInfo(leftHandLandmarks) {
    if (!leftHandLandmarks || leftHandLandmarks.length < 9) return;

        try {
        const pinchX = (leftHandLandmarks[4].x + leftHandLandmarks[8].x) / 2 * width;
        const pinchY = (leftHandLandmarks[4].y + leftHandLandmarks[8].y) / 2 * height;

                drawDebugCrosshair(pinchX, pinchY);

        push();
        noStroke();
        fill(255, 0, 0, 100);
        ellipse(leftHandLandmarks[4].x * width, leftHandLandmarks[4].y * height, 8, 8); 

                fill(0, 255, 0, 100);
        ellipse(leftHandLandmarks[8].x * width, leftHandLandmarks[8].y * height, 8, 8); 
        pop();
    } catch (error) {
        console.log('Debug drawing error:', error);
    }
} 