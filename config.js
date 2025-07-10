export const DETECTION_THRESHOLDS = {
    PINCH_BASE: 0.06,
    PINCH_MODES: {
        volume: 0.08,
        reverb: 0.08,
        panning: 0.05,
        equalizer: 0.04,
        wobble: 0.07
    },
    TAP: 0.05,
    SWIPE_MIN_DISTANCE: 150,
    SWIPE_MIN_TIME: 200,
    SWIPE_MAX_TIME: 1000,
    LONG_PRESS: 0.05  
};

export const TIMING = {
    SWIPE_HISTORY_SIZE: 20,
    SWIPE_COOLDOWN: 500,
    DOUBLE_TAP_WINDOW: 400,
    TAP_COOLDOWN: 100,
    GESTURE_COOLDOWN: 500,
    BUFFER_SIZE: 2,  
    SMOOTHING_FRAMES: 3,  
    TIMEOUT_DURATION: 5000,
    LONG_PRESS_DURATION: 500,  
    MENU_OPEN_DELAY: 300,      
    MENU_SELECTION_DISTANCE: 50  
};

export const VISUAL = {
    SPHERE: {
        BASE_SIZE: 150,
        MIN_SIZE: 30,
        MAX_SIZE: 350,
        LATITUDES: 20
    },
    HOURGLASS: {
        BASE_SIZE: 100,
        MIN_SIZE: 30,
        MAX_SIZE: 250,
        NUM_RINGS: 16,
        MAX_HEIGHT: 430
    },
    EQUALIZER: {
        BASE_RADIUS: 180,
        SPACING_MIN: 10,
        SPACING_MAX: 200,
        THICKNESS_MIN: 0.5,
        THICKNESS_MAX: 12,
        WIDTH_MIN: 0.6,
        WIDTH_MAX: 1.6
    },
    WOBBLE_CUBE: {
        SIZE: 300,
        GRID_DIVISIONS: 4,
        MIN_WOBBLE: 0,
        MAX_WOBBLE: 40
    },
    RADIAL_MENU: {
        RADIUS: 150,
        CENTER_BALL_SIZE: 30,
        MODE_BALL_SIZE: 25,
        LABEL_DISTANCE: 180
    }
};

export const MIDI_CC = {
    VOLUME: 7,
    REVERB: 91,
    EQ_LOW: 102,
    EQ_MID: 103,
    EQ_HIGH: 104,
    PANNING: 10,
    WOBBLE: 105,
    PLAY: 106,
    STOP: 107
};

export const COLORS = {
    LEFT_HAND: { r: 147, g: 51, b: 234 },
    RIGHT_HAND: { r: 236, g: 72, b: 153 },
    WHITE: { r: 255, g: 255, b: 255 },
    ACTIVE: { r: 255, g: 255, b: 255 },
    INACTIVE: { r: 120, g: 120, b: 120 },
    MENU_CENTER: { r: 255, g: 255, b: 255 },
    MENU_OPTION: { r: 200, g: 200, b: 200 },
    MENU_SELECTED: { r: 100, g: 255, b: 100 }
};

export const DEFAULTS = {
    VOLUME: 64,
    REVERB: 64,
    EQ_LOW: 64,
    EQ_MID: 64,
    EQ_HIGH: 64,
    PANNING: 64,
    WOBBLE: 0,
    MIN_DISTANCE: 20,
    MAX_DISTANCE: 800
}; 