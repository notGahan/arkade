# Arkade

A gesture-controlled audio interface using hand tracking and MIDI.

## File Structure

### HTML Files
- **`index.html`** - **Onboarding page** (loads first by default)
- **`main.html`** - Main application interface
- **`onboarding-styles.css`** - Styles for onboarding
- **`styles.css`** - Styles for main application

### JavaScript Files
- **`onboarding-app.js`** - Onboarding logic and hand detection tutorial
- **`main.js`** - Main application entry point
- **`config.js`** - Configuration constants
- **`state.js`** - State management
- **`gestures.js`** - Gesture recognition
- **`audio.js`** - MIDI/audio handling
- **`ui.js`** - UI management
- **`visuals.js`** - 3D visualizations
- **`menu.js`** - Radial menu system
- **`calibration.js`** - Hand calibration
- **`physics.js`** - Spring animations

## Flow

1. **Onboarding** (`index.html`) - Users first see hand detection tutorial
2. **Mode Selection** - Users select their preferred mode through the radial menu
3. **Main App** (`main.html`) - Application launches with the selected mode

## Why This Structure?

- **`index.html` serves as onboarding** - Web servers default to serving `index.html`, so this ensures users always see the onboarding first
- **`main.html` contains the full app** - The complete application interface is loaded after onboarding completion
- **Seamless transition** - The onboarding automatically redirects to `main.html` when complete

## Usage

1. Open the directory in a web server (or use Live Server)
2. Navigate to the root URL - onboarding will load automatically
3. Follow the hand detection tutorial
4. Select your preferred mode in the radial menu
5. Start using the gesture controls!

## Development

To run the application locally:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` to see the onboarding. 