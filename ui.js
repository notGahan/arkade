

import { appState, controlValues } from './state.js';

export function switchMode() {
    if (appState.currentMode === 'volume') {
        appState.currentMode = 'reverb';
    } else if (appState.currentMode === 'reverb') {
        appState.currentMode = 'equalizer';
    } else if (appState.currentMode === 'equalizer') {
        appState.currentMode = 'panning';
    } else if (appState.currentMode === 'panning') {
        appState.currentMode = 'wobble';
    } else {
        appState.currentMode = 'volume';
    }
    updateUIForMode();
    console.log('Mode switched to:', appState.currentMode);
}

export function updateUIForMode() {

        document.querySelectorAll('.info-card').forEach(card => card.classList.remove('active'));


            hideAllInstructionCards();


            const eqBottomIndicators = document.getElementById('equalizer-bottom-indicators');
    if (eqBottomIndicators) {
        eqBottomIndicators.classList.remove('active');
    }

        if (appState.currentMode === 'volume') {
        document.getElementById('volume-card').classList.add('active');
        updateVolumeCard();
        showVolumeInstructionCard();
        showVolumeMenuInstruction();
    } else if (appState.currentMode === 'reverb') {
        document.getElementById('space-card').classList.add('active');
        updateSpaceCard();
        showSpaceyInstructionCard();
        showSpaceyMenuInstruction();
    } else if (appState.currentMode === 'panning') {
        document.getElementById('direction-card').classList.add('active');
        updatePanningCard();
        showDirectionInstructionCard();
        showDirectionMenuInstruction();
    } else if (appState.currentMode === 'wobble') {
        document.getElementById('wobble-card').classList.add('active');
        updateWobbleCard();
        showWobbleInstructionCard();
        showWobbleMenuInstruction();
    } else if (appState.currentMode === 'equalizer') {
        document.getElementById('equalizer-cards').classList.add('active');
        updateEqualizerCards();
        showBalanceInstructionCards();
        showBalanceMenuInstruction();

                if (eqBottomIndicators) {
            eqBottomIndicators.classList.add('active');
        }
    }
}

function updateVolumeCard() {
    const internalValue = controlValues.volume.current;
    const displayValue = Math.round((internalValue / 127) * 100);
    const progressBar = document.getElementById('volume-progress');
    const valueText = document.getElementById('volume-value');

        if (progressBar && valueText) {
        const percentage = (internalValue / 127) * 100;
        progressBar.style.width = `${percentage}%`;
        valueText.textContent = displayValue.toString();
    }
}

function updateSpaceCard() {
    const internalValue = controlValues.reverb.current;
    const displayValue = Math.round((internalValue / 127) * 100);
    const progressBar = document.getElementById('space-progress');
    const valueText = document.getElementById('space-value');

        if (progressBar && valueText) {
        const percentage = (internalValue / 127) * 100;
        progressBar.style.width = `${percentage}%`;
        valueText.textContent = displayValue.toString();
    }
}

function updateWobbleCard() {
    const internalValue = controlValues.wobble.current;
    const displayValue = Math.round((internalValue / 127) * 100);
    const progressBar = document.getElementById('wobble-progress');
    const valueText = document.getElementById('wobble-value');

        if (progressBar && valueText) {
        const percentage = (internalValue / 127) * 100;
        progressBar.style.width = `${percentage}%`;
        valueText.textContent = displayValue.toString();
    }
}

function updateEqualizerCards() {

        const highInternalValue = controlValues.equalizer.high.current;
    const highDisplayValue = Math.round((highInternalValue / 127) * 100);
    const highProgressBar = document.getElementById('high-progress');
    const highValueText = document.getElementById('high-value');

        if (highProgressBar && highValueText) {
        const highPercentage = (highInternalValue / 127) * 100;
        highProgressBar.style.width = `${highPercentage}%`;
        highValueText.textContent = highDisplayValue.toString();
    }


            const midInternalValue = controlValues.equalizer.mid.current;
    const midDisplayValue = Math.round((midInternalValue / 127) * 100);
    const midProgressBar = document.getElementById('mid-progress');
    const midValueText = document.getElementById('mid-value');

        if (midProgressBar && midValueText) {
        const midPercentage = (midInternalValue / 127) * 100;
        midProgressBar.style.width = `${midPercentage}%`;
        midValueText.textContent = midDisplayValue.toString();
    }


            const lowInternalValue = controlValues.equalizer.low.current;
    const lowDisplayValue = Math.round((lowInternalValue / 127) * 100);
    const lowProgressBar = document.getElementById('low-progress');
    const lowValueText = document.getElementById('low-value');

        if (lowProgressBar && lowValueText) {
        const lowPercentage = (lowInternalValue / 127) * 100;
        lowProgressBar.style.width = `${lowPercentage}%`;
        lowValueText.textContent = lowDisplayValue.toString();
    }
}

function updatePanningCard() {
    const value = controlValues.panning.current;
    const indicator = document.getElementById('panning-indicator');

    if (indicator) {

                indicator.style.transition = 'none';

                if (Math.abs(value - 64) < 0.5) {

                        indicator.style.left = '50%';
            indicator.style.width = '2px';
            indicator.style.transform = 'translateX(-1px)';
        } else if (value < 64) {

                        const percentage = ((64 - value) / 64) * 50;
            indicator.style.left = `${50 - percentage}%`;
            indicator.style.width = `${percentage}%`;
            indicator.style.transform = '';
        } else {

                        const percentage = ((value - 64) / 63) * 50;
            indicator.style.left = '50%';
            indicator.style.width = `${percentage}%`;
            indicator.style.transform = '';
        }
    }
}


export function updateCurrentModeCard() {
    if (appState.currentMode === 'volume') {
        updateVolumeCard();
    } else if (appState.currentMode === 'reverb') {
        updateSpaceCard();
    } else if (appState.currentMode === 'wobble') {
        updateWobbleCard();
    } else if (appState.currentMode === 'equalizer') {
        updateEqualizerCards();
    } else if (appState.currentMode === 'panning') {
        updatePanningCard();
    }
}



export function handleKeyPress(key) {
    if (key === 'c' || key === 'C') {

                return 'calibrate';
    } else if (key === 's' || key === 'S') {
        switchMode();
        return 'switch';
    }
    return null;
}


let volumeLottieAnimation = null;
let spaceyLottieAnimation = null;
let directionLottieAnimation = null;
let wobbleLottieAnimation = null;
let balanceLowLottieAnimation = null;
let balanceMidLottieAnimation = null;
let balanceHighLottieAnimation = null;

function hideAllInstructionCards() {
    const volumeCard = document.getElementById('volume-instruction-card');
    if (volumeCard) {
        volumeCard.style.display = 'none';
    }

        const spaceyCard = document.getElementById('spacey-instruction-card');
    if (spaceyCard) {
        spaceyCard.style.display = 'none';
    }

        const directionCard = document.getElementById('direction-instruction-card');
    if (directionCard) {
        directionCard.style.display = 'none';
    }

        const wobbleCard = document.getElementById('wobble-instruction-card');
    if (wobbleCard) {
        wobbleCard.style.display = 'none';
    }

        const balanceCards = document.getElementById('balance-instruction-cards');
    if (balanceCards) {
        balanceCards.style.display = 'none';
    }


            document.querySelectorAll('.mode-instruction').forEach(instruction => {
        instruction.classList.remove('active');
        instruction.style.display = 'none';
    });


            if (volumeLottieAnimation) {
        volumeLottieAnimation.destroy();
        volumeLottieAnimation = null;
    }
    if (spaceyLottieAnimation) {
        spaceyLottieAnimation.destroy();
        spaceyLottieAnimation = null;
    }
    if (directionLottieAnimation) {
        directionLottieAnimation.destroy();
        directionLottieAnimation = null;
    }
    if (wobbleLottieAnimation) {
        wobbleLottieAnimation.destroy();
        wobbleLottieAnimation = null;
    }
    if (balanceLowLottieAnimation) {
        balanceLowLottieAnimation.destroy();
        balanceLowLottieAnimation = null;
    }
    if (balanceMidLottieAnimation) {
        balanceMidLottieAnimation.destroy();
        balanceMidLottieAnimation = null;
    }
    if (balanceHighLottieAnimation) {
        balanceHighLottieAnimation.destroy();
        balanceHighLottieAnimation = null;
    }
}

function showVolumeInstructionCard() {
    const volumeCard = document.getElementById('volume-instruction-card');
    if (volumeCard) {
        volumeCard.style.display = 'flex';


                        const lottieContainer = document.getElementById('volume-lottie-animation');
        if (lottieContainer && window.lottie && !volumeLottieAnimation) {

                        lottieContainer.innerHTML = '';

                        volumeLottieAnimation = window.lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'assets/pinch-spread.json'
            });
        }
    }


            const volumeMenuInstruction = document.getElementById('volume-menu-instruction');
    if (volumeMenuInstruction) {
        volumeMenuInstruction.classList.add('active');
    }
}

function showVolumeMenuInstruction() {
    const volumeMenuInstruction = document.getElementById('volume-menu-instruction');
    if (volumeMenuInstruction) {

                volumeMenuInstruction.style.display = 'flex';
        volumeMenuInstruction.style.visibility = 'visible';
        volumeMenuInstruction.style.opacity = '1';
        volumeMenuInstruction.classList.add('active');
        console.log('Volume menu instruction should be visible now');
        console.log('Element computed style:', window.getComputedStyle(volumeMenuInstruction).display);
    } else {
        console.log('Volume menu instruction element not found!');
    }
}

function showSpaceyInstructionCard() {
    const spaceyCard = document.getElementById('spacey-instruction-card');
    if (spaceyCard) {
        spaceyCard.style.display = 'flex';


                        const lottieContainer = document.getElementById('spacey-lottie-animation');
        if (lottieContainer && window.lottie && !spaceyLottieAnimation) {

                        lottieContainer.innerHTML = '';

                        spaceyLottieAnimation = window.lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'assets/pinch-spread.json'
            });
        }
    }
}

function showSpaceyMenuInstruction() {
    const spaceyMenuInstruction = document.getElementById('spacey-menu-instruction');
    if (spaceyMenuInstruction) {

                spaceyMenuInstruction.style.display = 'flex';
        spaceyMenuInstruction.style.visibility = 'visible';
        spaceyMenuInstruction.style.opacity = '1';
        spaceyMenuInstruction.classList.add('active');
        console.log('Spacey menu instruction should be visible now');
    } else {
        console.log('Spacey menu instruction element not found!');
    }
}

function showDirectionInstructionCard() {
    const directionCard = document.getElementById('direction-instruction-card');
    if (directionCard) {
        directionCard.style.display = 'flex';


                        const lottieContainer = document.getElementById('direction-lottie-animation');
        if (lottieContainer && window.lottie && !directionLottieAnimation) {

                        lottieContainer.innerHTML = '';

                        directionLottieAnimation = window.lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'assets/panning.json'
            });
        }
    }
}

function showDirectionMenuInstruction() {
    const directionMenuInstruction = document.getElementById('direction-menu-instruction');
    if (directionMenuInstruction) {

                directionMenuInstruction.style.display = 'flex';
        directionMenuInstruction.style.visibility = 'visible';
        directionMenuInstruction.style.opacity = '1';
        directionMenuInstruction.classList.add('active');
        console.log('Direction menu instruction should be visible now');
    } else {
        console.log('Direction menu instruction element not found!');
    }
}

function showWobbleInstructionCard() {
    const wobbleCard = document.getElementById('wobble-instruction-card');
    if (wobbleCard) {
        wobbleCard.style.display = 'flex';


                        const lottieContainer = document.getElementById('wobble-lottie-animation');
        if (lottieContainer && window.lottie && !wobbleLottieAnimation) {

                        lottieContainer.innerHTML = '';

                        wobbleLottieAnimation = window.lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'assets/pinch-spread.json'
            });
        }
    }
}

function showWobbleMenuInstruction() {
    const wobbleMenuInstruction = document.getElementById('wobble-menu-instruction');
    if (wobbleMenuInstruction) {

                wobbleMenuInstruction.style.display = 'flex';
        wobbleMenuInstruction.style.visibility = 'visible';
        wobbleMenuInstruction.style.opacity = '1';
        wobbleMenuInstruction.classList.add('active');
        console.log('Wobble menu instruction should be visible now');
    } else {
        console.log('Wobble menu instruction element not found!');
    }
}

function showBalanceInstructionCards() {
    const balanceCards = document.getElementById('balance-instruction-cards');
    if (balanceCards) {
        balanceCards.style.display = 'flex';


                        const lowLottieContainer = document.getElementById('balance-low-lottie-animation');
        if (lowLottieContainer && window.lottie && !balanceLowLottieAnimation) {
            lowLottieContainer.innerHTML = '';
            balanceLowLottieAnimation = window.lottie.loadAnimation({
                container: lowLottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'assets/pinch-horizontal.json'
            });
        }


                        const midLottieContainer = document.getElementById('balance-mid-lottie-animation');
        if (midLottieContainer && window.lottie && !balanceMidLottieAnimation) {
            midLottieContainer.innerHTML = '';
            balanceMidLottieAnimation = window.lottie.loadAnimation({
                container: midLottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'assets/pinch-diagonal.json'
            });
        }


                        const highLottieContainer = document.getElementById('balance-high-lottie-animation');
        if (highLottieContainer && window.lottie && !balanceHighLottieAnimation) {
            highLottieContainer.innerHTML = '';
            balanceHighLottieAnimation = window.lottie.loadAnimation({
                container: highLottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'assets/pinch-vertical.json'
            });
        }
    }
}

function showBalanceMenuInstruction() {
    const balanceMenuInstruction = document.getElementById('balance-menu-instruction');
    if (balanceMenuInstruction) {

                balanceMenuInstruction.style.display = 'flex';
        balanceMenuInstruction.style.visibility = 'visible';
        balanceMenuInstruction.style.opacity = '1';
        balanceMenuInstruction.classList.add('active');
        console.log('Balance menu instruction should be visible now');
    } else {
        console.log('Balance menu instruction element not found!');
    }
}