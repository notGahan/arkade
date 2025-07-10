import { TIMING, VISUAL } from './config.js';
import { appState, controlValues, visualState, animationState } from './state.js';
import { updateCurrentModeCard } from './ui.js';

let audioContext;
let audioSources = {};
let gainNodes = {};
let pannerNodes = {};
let delayNode;
let delayFeedback;
let synthEchoGain;
let synthDryGain;
let isPlaying = false;

export async function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create echo delay
    createEcho();
    
    const stemFiles = ['bass.mp3', 'drums.mp3', 'synth.mp3', 'vocals.mp3'];
    
    for (const file of stemFiles) {
        try {
            const response = await fetch(`stems/${file}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true;
            
            const gainNode = audioContext.createGain();
            gainNode.gain.value = file === 'synth.mp3' ? 0.5 : 1.0;
            
            const pannerNode = audioContext.createStereoPanner();
            pannerNode.pan.value = 0;
            
            source.connect(gainNode);
            
            if (file === 'synth.mp3') {
                // Create dry/wet mix for synth echo
                synthDryGain = audioContext.createGain();
                synthEchoGain = audioContext.createGain();
                synthDryGain.gain.value = 1.0;
                synthEchoGain.gain.value = 0.0;
                
                gainNode.connect(synthDryGain);
                gainNode.connect(synthEchoGain);
                
                synthEchoGain.connect(delayNode);
                delayNode.connect(delayFeedback);
                delayFeedback.connect(pannerNode);
                delayFeedback.connect(delayNode); // Feedback loop for multiple echoes
                synthDryGain.connect(pannerNode);
            } else {
                gainNode.connect(pannerNode);
            }
            
            pannerNode.connect(audioContext.destination);
            
            audioSources[file] = source;
            gainNodes[file] = gainNode;
            pannerNodes[file] = pannerNode;
            
        } catch (error) {
            console.error(`Failed to load ${file}:`, error);
        }
    }
}

function createEcho() {
    // Create delay node for echo effect
    delayNode = audioContext.createDelay(2.0); // Max 2 second delay
    delayNode.delayTime.value = 0.3; // 300ms delay for distinct echo
    
    // Create feedback gain for echo repetitions
    delayFeedback = audioContext.createGain();
    delayFeedback.gain.value = 0.4; // 40% feedback for multiple echoes
}

export function playAudio() {
    if (isPlaying) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    Object.values(audioSources).forEach(source => {
        source.start();
    });
    
    isPlaying = true;
}

export function stopAudio() {
    if (!isPlaying) return;
    
    Object.values(audioSources).forEach(source => {
        source.stop();
    });
    
    isPlaying = false;
    
    // Reinitialize audio for next play
    setTimeout(() => {
        initAudio();
    }, 100);
}

export function setSynthVolume(volume) {
    if (gainNodes['synth.mp3']) {
        const normalizedVolume = volume / 127;
        gainNodes['synth.mp3'].gain.setValueAtTime(normalizedVolume, audioContext.currentTime);
    }
}

export function setSynthEcho(echo) {
    if (synthDryGain && synthEchoGain && delayNode && delayFeedback) {
        const normalizedEcho = echo / 127;
        
        // Control echo parameters based on input
        // Delay time: from 100ms to 800ms
        const delayTime = 0.1 + (normalizedEcho * 0.7);
        delayNode.delayTime.setValueAtTime(delayTime, audioContext.currentTime);
        
        // Feedback: from 0% to 60% for varying echo repetitions
        const feedbackAmount = normalizedEcho * 0.6;
        delayFeedback.gain.setValueAtTime(feedbackAmount, audioContext.currentTime);
        
        // Dry/Wet mix for echo effect
        const dryLevel = Math.cos(normalizedEcho * Math.PI / 2);
        const wetLevel = Math.sin(normalizedEcho * Math.PI / 2) * 1.2; // Boost wet signal
        
        synthDryGain.gain.setValueAtTime(dryLevel, audioContext.currentTime);
        synthEchoGain.gain.setValueAtTime(wetLevel, audioContext.currentTime);
    }
}

export function setPanning(pan) {
    const normalizedPan = (pan - 64) / 63; // Convert 0-127 to -1 to 1
    const clampedPan = Math.max(-1, Math.min(1, normalizedPan));
    
    Object.values(pannerNodes).forEach(pannerNode => {
        pannerNode.pan.setValueAtTime(clampedPan, audioContext.currentTime);
    });
}

export function processVolume(distance) {
    if (!appState.bothHandsPinching || appState.isCalibrating) {
        if (appState.isCalibrating) {
            appState.calibrationValues.push(distance);
        }
        return;
    }

    let vol = map(distance, appState.minDistance, appState.maxDistance, 0, 127);
    vol = constrain(vol, 0, 127);

    controlValues.volume.history.push(vol);
    if (controlValues.volume.history.length > TIMING.SMOOTHING_FRAMES) {
        controlValues.volume.history.shift();
    }

    let sum = 0;
    for (let i = 0; i < controlValues.volume.history.length; i++) {
        sum += controlValues.volume.history[i];
    }
    controlValues.volume.target = sum / controlValues.volume.history.length;

    const newTargetSize = map(controlValues.volume.target, 0, 127, VISUAL.SPHERE.MIN_SIZE, VISUAL.SPHERE.MAX_SIZE);
    animationState.visuals.sphere.size.setTarget(newTargetSize);

    setSynthVolume(controlValues.volume.target);

    if (abs(controlValues.volume.target - controlValues.volume.current) > 0.1) {
        updateCurrentModeCard();
    }
}

export function processReverb(distance) {
    if (!appState.bothHandsPinching || appState.isCalibrating) {
        if (appState.isCalibrating) {
            appState.calibrationValues.push(distance);
        }
        return;
    }

    let reverb = map(distance, appState.minDistance, appState.maxDistance, 0, 127);
    reverb = constrain(reverb, 0, 127);

    controlValues.reverb.history.push(reverb);
    if (controlValues.reverb.history.length > TIMING.SMOOTHING_FRAMES) {
        controlValues.reverb.history.shift();
    }

    let sum = 0;
    for (let i = 0; i < controlValues.reverb.history.length; i++) {
        sum += controlValues.reverb.history[i];
    }
    controlValues.reverb.target = sum / controlValues.reverb.history.length;

    const newTargetSize = map(controlValues.reverb.target, 0, 127, VISUAL.HOURGLASS.MIN_SIZE, VISUAL.HOURGLASS.MAX_SIZE);
    animationState.visuals.hourglass.size.setTarget(newTargetSize);

    setSynthEcho(controlValues.reverb.target);

    if (abs(controlValues.reverb.target - controlValues.reverb.current) > 0.1) {
        updateCurrentModeCard();
    }
}

export function updatePanningValue(panning) {
    controlValues.panning.history.push(panning);
    if (controlValues.panning.history.length > TIMING.SMOOTHING_FRAMES) {
        controlValues.panning.history.shift();
    }

    let sum = 0;
    for (let i = 0; i < controlValues.panning.history.length; i++) {
        sum += controlValues.panning.history[i];
    }
    controlValues.panning.target = sum / controlValues.panning.history.length;

    const newTargetPosition = map(controlValues.panning.target, 0, 127, -1, 1);
    animationState.visuals.panning.position.setTarget(newTargetPosition);

    setPanning(controlValues.panning.target);

    if (abs(controlValues.panning.target - controlValues.panning.current) > 0.1) {
        updateCurrentModeCard();
    }
}

 