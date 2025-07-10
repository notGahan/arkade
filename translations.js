export const translations = {
    en: {
        // App title and header
        appTitle: "ARKADE",
        
        // Mode names
        volume: "VOLUME",
        space: "SPACE", 
        wobble: "WOBBLE",
        balance: "BALANCE",
        direction: "DIRECTION",
        equalizer: "EQUALIZER",
        panning: "PANNING",
        reverb: "REVERB",
        
        // EQ bands
        high: "HIGH",
        mid: "MID", 
        low: "LOW",
        
        // Instructions
        pinchSpreadVolume: "PINCH USING BOTH HANDS AND SPREAD TO CONTROL VOLUME",
        pinchSpreadSpace: "PINCH USING BOTH HANDS AND SPREAD TO CONTROL SPACE",
        pinchSpreadWobble: "PINCH USING BOTH HANDS AND SPREAD TO CONTROL WOBBLE",
        pointDirection: "POINT WITH LEFT HAND TO CONTROL DIRECTION",
        
        // Menu instructions
        pinchHoldMenu: "PINCH AND HOLD ON LEFT HAND FOR MENU",
        
        // Hand positioning
        keepHandsParallel: "KEEP HANDS PARALLEL TO SCREEN",
        keepLeftHandParallel: "KEEP LEFT HAND PARALLEL TO SCREEN", 
        keepRightHandParallel: "KEEP RIGHT HAND PARALLEL TO SCREEN",
        keepBothHandsParallel: "KEEP BOTH HANDS PARALLEL TO SCREEN",
        adjustHandAngle: "Adjust hand angle for better tracking",
        adjustLeftHand: "Adjust left hand angle for better tracking",
        adjustRightHand: "Adjust right hand angle for better tracking",
        adjustBothHands: "Adjust both hands for better tracking",
        
        // Panning labels
        panningLeft: "L",
        panningCenter: "CENTRE", 
        panningRight: "R",
        
        // Controls
        connectMidi: "CONNECT MIDI",
        disconnectMidi: "DISCONNECT MIDI",
        play: "Play",
        stop: "Stop",
        calibrate: "Calibrate",
        
        // Language toggle
        language: "EN",
        
        // Onboarding instructions
        showHandsToCamera: "SHOW YOUR HANDS TO THE CAMERA",
        bothHandsDetected: "GREAT! BOTH HANDS DETECTED",
        pinchHoldForMenu: "PINCH AND HOLD WITH YOUR LEFT HAND TO ACCESS THE MENU ANYTIME",
        dragToSelectEffect: "WHILE PINCHING, DRAG TO AN EFFECT AND LET GO TO SELECT",
        dragToSelectVolume: "WHILE PINCHING, DRAG TO VOLUME AND LET GO TO SELECT"
    },
    
    it: {
        // App title and header
        appTitle: "ARKADE",
        
        // Mode names
        volume: "VOLUME",
        space: "SPAZIO",
        wobble: "OSCILLAZIONE", 
        balance: "BILANCIAMENTO",
        direction: "DIREZIONE",
        equalizer: "EQUALIZZATORE",
        panning: "PANORAMICA",
        reverb: "RIVERBERO",
        
        // EQ bands
        high: "ACUTI",
        mid: "MEDI",
        low: "BASSI",
        
        // Instructions
        pinchSpreadVolume: "PIZZICA CON ENTRAMBE LE MANI E ALLARGA PER CONTROLLARE IL VOLUME",
        pinchSpreadSpace: "PIZZICA CON ENTRAMBE LE MANI E ALLARGA PER CONTROLLARE LO SPAZIO",
        pinchSpreadWobble: "PIZZICA CON ENTRAMBE LE MANI E ALLARGA PER CONTROLLARE L'OSCILLAZIONE",
        pointDirection: "MIRARE CON LA MANO SINISTRA PER CONTROLLARE LA DIREZIONE",
        
        // Menu instructions
        pinchHoldMenu: "PIZZICA E TIENI CON LA MANO DESTRA PER IL MENU",
        
        // Hand positioning
        keepHandsParallel: "TIENI LE MANI PARALLELE ALLO SCHERMO",
        keepLeftHandParallel: "TIENI LA MANO SINISTRA PARALLELA ALLO SCHERMO",
        keepRightHandParallel: "TIENI LA MANO DESTRA PARALLELA ALLO SCHERMO", 
        keepBothHandsParallel: "TIENI ENTRAMBE LE MANI PARALLELE ALLO SCHERMO",
        adjustHandAngle: "Regola l'angolo della mano per un migliore tracciamento",
        adjustLeftHand: "Regola l'angolo della mano sinistra per un migliore tracciamento",
        adjustRightHand: "Regola l'angolo della mano destra per un migliore tracciamento", 
        adjustBothHands: "Regola entrambe le mani per un migliore tracciamento",
        
        // Panning labels
        panningLeft: "S",
        panningCenter: "CENTRO",
        panningRight: "D", 
        
        // Controls
        connectMidi: "CONNETTI MIDI",
        disconnectMidi: "DISCONNETTI MIDI", 
        play: "Riproduci",
        stop: "Ferma",
        calibrate: "Calibra",
        
        // Language toggle
        language: "IT",
        
        // Onboarding instructions
        showHandsToCamera: "MOSTRA LE TUE MANI ALLA CAMERA",
        bothHandsDetected: "PERFETTO! ENTRAMBE LE MANI RILEVATE",
        pinchHoldForMenu: "PIZZICA E TIENI PREMUTO CON LA MANO SINISTRA PER ACCEDERE AL MENU IN QUALSIASI MOMENTO",
        dragToSelectEffect: "MENTRE PIZZICHI, TRASCINA SU UN EFFETTO E LASCIA ANDARE PER SELEZIONARE",
        dragToSelectVolume: "MENTRE PIZZICHI, TRASCINA SU VOLUME E LASCIA ANDARE PER SELEZIONARE"
    }
};

export function getTranslation(key, language = 'en') {
    return translations[language]?.[key] || translations.en[key] || key;
}