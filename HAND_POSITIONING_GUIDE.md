# Hand Positioning Guidance System

## Overview
The Hand Positioning Guidance Overlay provides real-time feedback to users when their hands are not optimally positioned parallel to the screen, helping improve gesture recognition accuracy.

## Implementation Details

### Core Algorithm
The system uses MediaPipe's 3D landmark data to calculate hand orientation:

1. **Palm Plane Calculation**: Uses three key landmarks (wrist, middle finger MCP, index finger MCP) to define the palm plane
2. **Normal Vector**: Calculates the palm normal using cross product of two palm vectors
3. **Angle Detection**: Compares palm normal with camera's z-axis to determine tilt angle
4. **Threshold Check**: Flags hands as poorly positioned if tilt exceeds 28 degrees

### Smart Warning System
- **Delayed Activation**: Warning appears only after 2 seconds of poor positioning
- **Hysteresis**: Different thresholds for showing/hiding prevent flickering
- **Context Awareness**: Suppresses warnings during active gestures and menu interactions
- **Severity Levels**: Differentiates between mild (one hand) and severe (both hands) cases

### Visual Design
- **Non-Intrusive**: Orange/amber gradient overlay positioned below logo
- **Animated**: Pulsing warning icon draws attention without being disruptive
- **Responsive**: Dynamic text updates based on which hand(s) need adjustment
- **Smooth Transitions**: Fade-in/fade-out prevents jarring appearance/disappearance

## Success Metrics
✅ **Non-Disruptive**: Warning integrates seamlessly without interfering with existing functionality  
✅ **Accurate Detection**: Reliably identifies hand orientation issues within 28-degree threshold  
✅ **Responsive Feedback**: Appears/disappears within 1-2 seconds of position changes  
✅ **Context Aware**: Intelligently suppresses warnings during active interactions  
✅ **Performance**: Minimal impact on frame rate or gesture detection latency  
✅ **Consistent Experience**: Identical behavior in both onboarding and main application 