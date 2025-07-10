import { appState } from './state.js';

export function startCalibration() {
    appState.isCalibrating = true;
    appState.calibrationValues = [];
    appState.calibrationStartTime = millis();
    document.getElementById('calibrate').textContent = 'Calibrating...';
}

export function drawCalibration() {
    const elapsed = millis() - appState.calibrationStartTime;
    const progress = elapsed / 3000;

    push();
    translate(-width / 2, -height / 2); 

    textAlign(CENTER);
    fill(255, 255, 0);
    textSize(24);
    text('CALIBRATING', width / 2, height / 2 - 40);
    textSize(16);
    text('Move hands close together and far apart', width / 2, height / 2);

    noFill();
    stroke(255);
    rect(width / 2 - 150, height / 2 + 20, 300, 20);
    fill(255, 255, 0);
    noStroke();
    rect(width / 2 - 150, height / 2 + 20, 300 * progress, 20);

        pop();

    if (elapsed > 3000) {
        finishCalibration();
    }
}

export function finishCalibration() {
    appState.isCalibrating = false;
    document.getElementById('calibrate').textContent = 'Calibrate';

    if (appState.calibrationValues.length > 0) {
        appState.minDistance = Math.min(...appState.calibrationValues) * 0.8;
        appState.maxDistance = Math.max(...appState.calibrationValues) * 1.2;

                console.log(`Calibrated: ${appState.minDistance} - ${appState.maxDistance}`);

        setTimeout(() => {
            alert(`Calibrated! Range: ${Math.round(appState.minDistance)} - ${Math.round(appState.maxDistance)} pixels`);
        }, 100);
    }
} 