

import { VISUAL, COLORS } from './config.js';
import { appState, controlValues, visualState, resetPanningParticles } from './state.js';
import { isFingersTouching } from './gestures.js';


export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = random(-1, 1);
        this.vy = random(-3, -1);
        this.color = color;
        this.life = 255;
        this.size = random(2, 5);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life -= 8;
    }

    display() {
        noStroke();
        fill(this.color.r, this.color.g, this.color.b, this.life);
        ellipse(this.x, this.y, this.size);
    }

    isDead() {
        return this.life <= 0;
    }
}


export function drawWireframeSphere() {
    push();


        visualState.sphere.rotation += 0.005;
    rotateX(-PI/6);
    rotateY(visualState.sphere.rotation);
    rotateZ(PI/8);


        if (appState.bothHandsPinching) {
        stroke(224, 170, 211, 200); 
        strokeWeight(1);
    } else {
        stroke(224, 170, 211, 120); 
        strokeWeight(1);
    }
    noFill();


        for (let lat = 0; lat < VISUAL.SPHERE.LATITUDES; lat++) {
        const latAngle = (lat / VISUAL.SPHERE.LATITUDES) * PI - PI/2;
        drawStraightLatitude(latAngle, visualState.sphere.size);
    }

    pop();
}

function drawStraightLatitude(latAngle, radius) {
    push();

        beginShape();
    noFill();

        const segments = 80;
    const latRadius = radius * cos(latAngle);
    const y = radius * sin(latAngle);

        for (let i = 0; i <= segments; i++) {
        const longitude = (i / segments) * TWO_PI;
        const x = latRadius * cos(longitude);
        const z = latRadius * sin(longitude);
        vertex(x, y, z);
    }
    endShape();

        pop();
}

export function drawWireframeHourglass() {
    push();


        visualState.hourglass.rotation += 0.005;
    rotateY(visualState.hourglass.rotation);
    rotateX(visualState.hourglass.rotation * 0.7);


        if (appState.bothHandsPinching) {
        stroke(156, 212, 228, 200); 
        strokeWeight(1);
    } else {
        stroke(156, 212, 228, 120); 
        strokeWeight(1);
    }
    noFill();


        const baseSize = visualState.hourglass.size * 1.2;
    const numRings = VISUAL.HOURGLASS.NUM_RINGS;


            const sizeScale = baseSize / 100;
    const maxTotalHeight = VISUAL.HOURGLASS.MAX_HEIGHT;
    const baseGapFactor = 0.2;

        let theoreticalHeight = 0;
    for (let i = 1; i <= numRings/2; i++) {
        const t = i / (numRings/2);
        const radius = baseSize * t * 0.8;
        if (radius > 5) {
            theoreticalHeight += radius * baseGapFactor;
        }
    }

        const heightScaleFactor = Math.min(1, (maxTotalHeight / 2) / theoreticalHeight);
    const sizeInfluence = heightScaleFactor * (1 + (sizeScale - 1) * 0.4);


            let cumulativeY = 0;
    for (let i = 1; i <= numRings/2; i++) {
        const t = i / (numRings/2);
        const radius = baseSize * t * 0.8;

                if (radius > 15) {
            const ringProportionalGap = radius * baseGapFactor * sizeInfluence;
            cumulativeY += ringProportionalGap;
            drawHorizontalRing(0, -cumulativeY, 0, radius);
        }
    }


            cumulativeY = 0;
    for (let i = 1; i <= numRings/2; i++) {
        const t = i / (numRings/2);
        const radius = baseSize * t * 0.8;

                if (radius > 15) {
            const ringProportionalGap = radius * baseGapFactor * sizeInfluence;
            cumulativeY += ringProportionalGap;
            drawHorizontalRing(0, cumulativeY, 0, radius);
        }
    }


            push();
    fill(156, 212, 228, 200); 
    noStroke();
    const centerSphereSize = 5 * (sizeScale * 0.6 + 0.3);
    sphere(centerSphereSize);
    pop();

    pop();
}

function drawHorizontalRing(x, y, z, radius) {
    push();
    translate(x, y, z);

        beginShape();
    noFill();

        const segments = 60;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * TWO_PI;
        const ringX = radius * cos(angle);
        const ringZ = radius * sin(angle);
        vertex(ringX, 0, ringZ);
    }
    endShape();

        pop();
}

export function drawEqualizer() {
    push();


        rotateX(-PI/6);
    rotateY(PI/8);


    noFill();


        const elasticTargetLow = visualState.equalizer.targetSizeLow + visualState.equalizer.elasticDecayLow;
    const elasticTargetMid = visualState.equalizer.targetSizeMid + visualState.equalizer.elasticDecayMid;
    const elasticTargetHigh = visualState.equalizer.targetSizeHigh + visualState.equalizer.elasticDecayHigh;

        visualState.equalizer.sizeLow = lerp(visualState.equalizer.sizeLow, elasticTargetLow, 0.08);
    visualState.equalizer.sizeMid = lerp(visualState.equalizer.sizeMid, elasticTargetMid, 0.08);
    visualState.equalizer.sizeHigh = lerp(visualState.equalizer.sizeHigh, elasticTargetHigh, 0.08);


        const baseRadius = VISUAL.EQUALIZER.BASE_RADIUS;


            const ringSpacing = map(visualState.equalizer.sizeHigh, 30, 200, VISUAL.EQUALIZER.SPACING_MIN, VISUAL.EQUALIZER.SPACING_MAX);
    const bottomThickness = map(visualState.equalizer.sizeLow, 30, 200, VISUAL.EQUALIZER.THICKNESS_MIN, VISUAL.EQUALIZER.THICKNESS_MAX);
    const middleWidth = map(visualState.equalizer.sizeMid, 30, 200, VISUAL.EQUALIZER.WIDTH_MIN, VISUAL.EQUALIZER.WIDTH_MAX);


        const rings = [
        { 
            yPos: ringSpacing, 
            radius: baseRadius, 
            thickness: bottomThickness, 
            scaleX: 1, 
            scaleZ: 1,
            isBottom: true
        },
        { 
            yPos: 0, 
            radius: baseRadius, 
            thickness: 1, 
            scaleX: middleWidth, 
            scaleZ: middleWidth,
            isMiddle: true 
        },
        { 
            yPos: -ringSpacing, 
            radius: baseRadius, 
            thickness: 1, 
            scaleX: 1, 
            scaleZ: 1,
            isTop: true
        }
    ];


        for (let ring of rings) {
        push();
        translate(0, ring.yPos, 0);


                if (appState.bothHandsPinching) {
            stroke(221, 235, 210, 200); 
        } else {
            stroke(221, 235, 210, 120); 
        }

        strokeWeight(ring.thickness);
        scale(ring.scaleX, 1, ring.scaleZ);

                beginShape();
        const segments = 80;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * TWO_PI;
            const x = ring.radius * cos(angle);
            const z = ring.radius * sin(angle);
            vertex(x, 0, z);
        }
        endShape();

        pop();
    }


        if (appState.bothHandsPinching) {
        stroke(221, 235, 210, 80); 
        strokeWeight(1);

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * TWO_PI;

                        const topX = baseRadius * cos(angle);
            const topZ = baseRadius * sin(angle);
            const midX = baseRadius * cos(angle) * middleWidth;
            const midZ = baseRadius * sin(angle) * middleWidth;
            const botX = baseRadius * cos(angle);
            const botZ = baseRadius * sin(angle);

                        line(topX, ringSpacing, topZ, midX, 0, midZ);
            line(midX, 0, midZ, botX, -ringSpacing, botZ);
        }
    }

    pop();
}

export function drawWireframePanning() {
    push();

        visualState.panning.panPosition = lerp(visualState.panning.panPosition, visualState.panning.targetPanPosition, 0.05);
    const pan = visualState.panning.panPosition;

        let leftFill, rightFill;

        if (pan <= 0) {
        leftFill = map(pan, -1, 0, 1.0, 0.5);
        rightFill = map(pan, -1, 0, 0.0, 0.5);
    } else {
        leftFill = map(pan, 0, 1, 0.5, 0.0);
        rightFill = map(pan, 0, 1, 0.5, 1.0);
    }

        const speakerWidth = 200;
    const speakerHeight = 280;
    const speakerDepth = 140;
    const speakerSpacing = 1200;
    const speakerCircleRadius = 50;

        push();
    translate(-speakerSpacing/2, 0, 0);
    rotateX(radians(-20));
    rotateY(radians(20));
    drawSpeaker(speakerWidth, speakerHeight, speakerDepth, speakerCircleRadius, leftFill);
    pop();

        push();
    translate(speakerSpacing/2, 0, 0);
    rotateX(radians(-20));
    rotateY(radians(-20));
    drawSpeaker(speakerWidth, speakerHeight, speakerDepth, speakerCircleRadius, rightFill);
    pop();

        pop();
}

function drawSpeaker(width, height, depth, circleRadius, fillLevel) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;


            let wireColor, fillColor;
    if (appState.isPanningActive) {

                wireColor = [247, 231, 179, 255];
        fillColor = [247, 231, 179, 120];
    } else {

                wireColor = [247, 231, 179, 120];
        fillColor = [247, 231, 179, 40];
    }

        stroke(wireColor[0], wireColor[1], wireColor[2], wireColor[3]);
    strokeWeight(1);
    noFill();

        beginShape();
    vertex(-halfWidth, -halfHeight, halfDepth);
    vertex(halfWidth, -halfHeight, halfDepth);
    vertex(halfWidth, halfHeight, halfDepth);
    vertex(-halfWidth, halfHeight, halfDepth);
    endShape(CLOSE);

        beginShape();
    vertex(-halfWidth, -halfHeight, -halfDepth);
    vertex(halfWidth, -halfHeight, -halfDepth);
    vertex(halfWidth, halfHeight, -halfDepth);
    vertex(-halfWidth, halfHeight, -halfDepth);
    endShape(CLOSE);

        line(-halfWidth, -halfHeight, halfDepth, -halfWidth, -halfHeight, -halfDepth);
    line(halfWidth, -halfHeight, halfDepth, halfWidth, -halfHeight, -halfDepth);
    line(halfWidth, halfHeight, halfDepth, halfWidth, halfHeight, -halfDepth);
    line(-halfWidth, halfHeight, halfDepth, -halfWidth, halfHeight, -halfDepth);

        push();
    translate(0, 0, halfDepth + 1);

        beginShape();
    for (let i = 0; i <= 32; i++) {
        const angle = (i / 32) * TWO_PI;
        const x = cos(angle) * circleRadius;
        const y = sin(angle) * circleRadius;
        vertex(x, y, 0);
    }
    endShape();

        beginShape();
    for (let i = 0; i <= 32; i++) {
        const angle = (i / 32) * TWO_PI;
        const x = cos(angle) * (circleRadius * 0.6);
        const y = sin(angle) * (circleRadius * 0.6);
        vertex(x, y, 0);
    }
    endShape();

        pop();

        if (fillLevel > 0.01) {
        const fillHeight = height * fillLevel;
        const fillTop = halfHeight - fillHeight;

                fill(fillColor[0], fillColor[1], fillColor[2], fillColor[3]);
        noStroke();

                beginShape();
        vertex(-halfWidth + 2, fillTop, halfDepth - 2);
        vertex(halfWidth - 2, fillTop, halfDepth - 2);
        vertex(halfWidth - 2, halfHeight - 2, halfDepth - 2);
        vertex(-halfWidth + 2, halfHeight - 2, halfDepth - 2);
        endShape();

                beginShape();
        vertex(-halfWidth + 2, fillTop, halfDepth - 2);
        vertex(-halfWidth + 2, fillTop, -halfDepth + 2);
        vertex(-halfWidth + 2, halfHeight - 2, -halfDepth + 2);
        vertex(-halfWidth + 2, halfHeight - 2, halfDepth - 2);
        endShape();

                beginShape();
        vertex(halfWidth - 2, fillTop, halfDepth - 2);
        vertex(halfWidth - 2, fillTop, -halfDepth + 2);
        vertex(halfWidth - 2, halfHeight - 2, -halfDepth + 2);
        vertex(halfWidth - 2, halfHeight - 2, halfDepth - 2);
        endShape();

                beginShape();
        vertex(-halfWidth + 2, fillTop, -halfDepth + 2);
        vertex(halfWidth - 2, fillTop, -halfDepth + 2);
        vertex(halfWidth - 2, halfHeight - 2, -halfDepth + 2);
        vertex(-halfWidth + 2, halfHeight - 2, -halfDepth + 2);
        endShape();

                beginShape();
        vertex(-halfWidth + 2, halfHeight - 2, halfDepth - 2);
        vertex(halfWidth - 2, halfHeight - 2, halfDepth - 2);
        vertex(halfWidth - 2, halfHeight - 2, -halfDepth + 2);
        vertex(-halfWidth + 2, halfHeight - 2, -halfDepth + 2);
        endShape();
    }
}

function createParticle(shape) {
    const x = random(-shape.width / 2, shape.width / 2);
    const y = random(-shape.height / 2, shape.height / 2);
    return {
        pos: createVector(x, y, random(-100, 100)),
        vel: createVector(0, 0, 0),
        acc: createVector(0, 0, 0),
        noiseOffset: createVector(random(1000), random(1000), random(1000))
    };
}

function drawParticleContainer(shape) {
    const w = shape.width / 2;
    const h = shape.height / 2;
    const c = shape.curve;

    stroke(255, 100);
    strokeWeight(1);

    beginShape();
    vertex(-w, -h);
    quadraticVertex(0, -h - c, w, -h);
    vertex(w, h);
    quadraticVertex(0, h + c, -w, h);
    endShape(CLOSE);
}

function drawCircle(radius) {
    beginShape();
    noFill();
    const segments = 60;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * TWO_PI;
        const x = cos(angle) * radius;
        const y = sin(angle) * radius;
        vertex(x, y, 0);
    }
    endShape();
}


export function drawHand(landmarks, color, alpha, isTrailOrSimple) {
    if (!landmarks || landmarks.length < 21) return;

        push();


            const points3D = landmarks.map(pt => ({
        x: pt.x * width,
        y: pt.y * height,
        z: (pt.z || 0) * 150
    }));


            const isPinching = isFingersTouching(landmarks);


            if (isPinching && !isTrailOrSimple) {
        drawPinchGlow(points3D[4], points3D[8], color, alpha);
    }


            const fingers = [
        [0, 1, 2, 3, 4],      
        [0, 5, 6, 7, 8],      
        [5, 9, 10, 11, 12],   
        [9, 13, 14, 15, 16],  
        [13, 17, 18, 19, 20]  
    ];

        const palmConnections = [
        [0, 5], [5, 9], [9, 13], [13, 17], [17, 0]
    ];


            if (isTrailOrSimple) {

                stroke(color.r, color.g, color.b, alpha);
        strokeWeight(2);
        noFill();


                        for (let finger of fingers) {
            for (let i = 0; i < finger.length - 1; i++) {
                const p1 = points3D[finger[i]];
                const p2 = points3D[finger[i + 1]];
                line(p1.x, p1.y, p2.x, p2.y);
            }
        }


                        for (let conn of palmConnections) {
            const p1 = points3D[conn[0]];
            const p2 = points3D[conn[1]];
            line(p1.x, p1.y, p2.x, p2.y);
        }


                        fill(color.r, color.g, color.b, alpha);
        noStroke();
        for (let i = 0; i < points3D.length; i++) {
            const pt = points3D[i];
            ellipse(pt.x, pt.y, 6, 6);
        }

                pop();
        return;
    }



                drawVolumetricHandStructure(points3D, fingers, palmConnections, color, alpha, isPinching);


            for (let finger of fingers) {
        drawVolumetricFinger(points3D, finger, color, alpha, false, isPinching);
    }


            for (let conn of palmConnections) {
        const palmAlpha = isPinching ? alpha * 0.1 : alpha * 0.6; 
        drawVolumetricConnection(points3D[conn[0]], points3D[conn[1]], color, palmAlpha, false);
    }


            for (let i = 0; i < points3D.length; i++) {
        drawVolumetricJoint(points3D[i], color, alpha, i, false, isPinching);


                        if ([0, 4, 8, 12, 16, 20].includes(i) && random() < 0.1) {
            appState.particles.push(new Particle(points3D[i].x, points3D[i].y, color));
        }
    }

        pop();
}

function drawVolumetricHandStructure(points3D, fingers, palmConnections, color, alpha, isPinching) {
    push();

        noStroke();
    const palmPoints = [0, 1, 5, 9, 13, 17];


            const structureAlpha = isPinching ? alpha * 0.1 : alpha;


            for (let layer = 3; layer > 0; layer--) {
        fill(color.r, color.g, color.b, structureAlpha * 0.03 * layer);

                beginShape();
        for (let i of palmPoints) {
            const pt = points3D[i];
            const zOffset = pt.z * 0.1 * layer;
            vertex(pt.x + zOffset, pt.y + zOffset);
        }
        endShape(CLOSE);
    }


            const fingerBases = [1, 5, 9, 13, 17];
    for (let i = 0; i < fingerBases.length - 1; i++) {
        const p1 = points3D[fingerBases[i]];
        const p2 = points3D[fingerBases[i + 1]];
        drawVolumetricConnection(p1, p2, color, structureAlpha * 0.3, false);
    }

        pop();
}

function drawVolumetricFinger(points3D, fingerIndices, color, alpha, isTrail, isPinching) {
    if (fingerIndices.length < 2) return;


            const isThumb = fingerIndices.includes(4);
    const isIndex = fingerIndices.includes(8);
    const isPinchingFinger = isThumb || isIndex;


            let fingerAlpha = alpha;
    if (isPinching && !isPinchingFinger) {
        fingerAlpha = alpha * 0.15; 
    }

        for (let i = 0; i < fingerIndices.length - 1; i++) {
        const p1 = points3D[fingerIndices[i]];
        const p2 = points3D[fingerIndices[i + 1]];

                const thickness = map(i, 0, fingerIndices.length - 2, 1.0, 0.4);
        drawVolumetricConnection(p1, p2, color, fingerAlpha * thickness, isTrail);
    }
}

function drawVolumetricConnection(p1, p2, color, alpha, isTrail) {
    const baseWidth = isTrail ? 4 : 12;
    const layers = isTrail ? 2 : 6;

        const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = sqrt(dx * dx + dy * dy);

        if (len < 1) return;

        const perpX = -dy / len;
    const perpY = dx / len;

        const avgZ = ((p1.z || 0) + (p2.z || 0)) / 2;
    const zOffset1 = (p1.z || 0) * 0.05;
    const zOffset2 = (p2.z || 0) * 0.05;


            for (let layer = layers; layer > 0; layer--) {
        const width = baseWidth * (layer / layers);
        const layerAlpha = alpha * (0.4 / layer);

                stroke(color.r, color.g, color.b, layerAlpha);
        strokeWeight(width);

                line(
            p1.x + zOffset1,
            p1.y + zOffset1,
            p2.x + zOffset2,
            p2.y + zOffset2
        );


                        if (!isTrail && layer === layers) {

                        stroke(color.r + 60, color.g + 60, color.b + 60, layerAlpha * 0.7);
            strokeWeight(width * 0.25);

                        line(
                p1.x + perpX * width * 0.25 + zOffset1,
                p1.y + perpY * width * 0.25 + zOffset1,
                p2.x + perpX * width * 0.25 + zOffset2,
                p2.y + perpY * width * 0.25 + zOffset2
            );


                                    stroke(color.r - 30, color.g - 30, color.b - 30, layerAlpha * 0.5);
            strokeWeight(width * 0.15);

                        line(
                p1.x - perpX * width * 0.3 + zOffset1,
                p1.y - perpY * width * 0.3 + zOffset1,
                p2.x - perpX * width * 0.3 + zOffset2,
                p2.y - perpY * width * 0.3 + zOffset2
            );
        }
    }
}

function drawVolumetricJoint(point, color, alpha, jointIndex, isTrail, isPinching) {
    const baseSize = getJointSize(jointIndex);
    const layers = isTrail ? 2 : 5;


            const isThumbJoint = jointIndex >= 1 && jointIndex <= 4;
    const isIndexJoint = jointIndex >= 5 && jointIndex <= 8;
    const isPinchingJoint = isThumbJoint || isIndexJoint;


            let jointAlpha = alpha;
    if (isPinching && !isPinchingJoint) {
        jointAlpha = alpha * 0.15; 
    }

        const zOffset = (point.z || 0) * 0.05;
    const x = point.x + zOffset;
    const y = point.y + zOffset;

        noStroke();


            for (let layer = layers; layer > 0; layer--) {
        const size = baseSize * (layer / layers) * (isTrail ? 0.6 : 1);
        const layerAlpha = jointAlpha * (0.5 / layer);

                fill(color.r, color.g, color.b, layerAlpha);
        ellipse(x, y, size, size);

                if (layer > 2) {
            fill(color.r, color.g, color.b, layerAlpha * 0.3);
            ellipse(x, y, size * 1.5, size * 1.5);
        }
    }


            if (!isTrail) {
        fill(color.r + 80, color.g + 80, color.b + 80, jointAlpha * 0.6);
        ellipse(x - baseSize * 0.15, y - baseSize * 0.15, baseSize * 0.4, baseSize * 0.4);

                fill(255, 255, 255, jointAlpha * 0.4);
        ellipse(x, y, baseSize * 0.2, baseSize * 0.2);
    }


            fill(color.r, color.g, color.b, isTrail ? jointAlpha * 0.8 : jointAlpha);
    ellipse(x, y, baseSize * (isTrail ? 0.3 : 0.5), baseSize * (isTrail ? 0.3 : 0.5));
}

function getJointSize(jointIndex) {

        if ([4, 8].includes(jointIndex)) {
        return 15;
    }

        if ([12, 16, 20].includes(jointIndex)) {
        return 12;
    }

        if ([0, 1, 5, 9, 13, 17].includes(jointIndex)) {
        return 8;
    }
    return 10; 
}

export function drawWireframeWobbleCube() {
    push();


            visualState.wobbleCube.rotation += 0.003;
    rotateX(PI/6);
    rotateY(visualState.wobbleCube.rotation);
    rotateZ(PI/12);


            const elasticTargetWobble = visualState.wobbleCube.targetWobbleAmount + visualState.wobbleCube.elasticDecay;
    visualState.wobbleCube.wobbleAmount = lerp(
        visualState.wobbleCube.wobbleAmount, 
        elasticTargetWobble, 
        0.08
    );

        const size = VISUAL.WOBBLE_CUBE.SIZE;
    const halfSize = size / 2;
    const divisions = VISUAL.WOBBLE_CUBE.GRID_DIVISIONS;
    const wobbleAmount = visualState.wobbleCube.wobbleAmount;


            if (appState.bothHandsPinching) {
        stroke(255, 120, 103, 200); 
        strokeWeight(1.5);
    } else {
        stroke(255, 120, 103, 120); 
        strokeWeight(1);
    }
    noFill();


            const drawWobblyLine = (x1, y1, z1, x2, y2, z2) => {
        beginShape();
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = lerp(x1, x2, t);
            const y = lerp(y1, y2, t);
            const z = lerp(z1, z2, t);



                                                const envelope = sin(t * PI); 

                        const wobbleX = sin(t * PI * 3 + millis() * 0.002) * wobbleAmount * 0.3 * envelope;
            const wobbleY = cos(t * PI * 3 + millis() * 0.003) * wobbleAmount * 0.3 * envelope;
            const wobbleZ = sin(t * PI * 2 + millis() * 0.001) * wobbleAmount * 0.2 * envelope;

                        vertex(x + wobbleX, y + wobbleY, z + wobbleZ);
        }
        endShape();
    };



                drawWobblyLine(-halfSize, -halfSize, halfSize, halfSize, -halfSize, halfSize);
    drawWobblyLine(halfSize, -halfSize, halfSize, halfSize, -halfSize, -halfSize);
    drawWobblyLine(halfSize, -halfSize, -halfSize, -halfSize, -halfSize, -halfSize);
    drawWobblyLine(-halfSize, -halfSize, -halfSize, -halfSize, -halfSize, halfSize);


            drawWobblyLine(-halfSize, halfSize, halfSize, halfSize, halfSize, halfSize);
    drawWobblyLine(halfSize, halfSize, halfSize, halfSize, halfSize, -halfSize);
    drawWobblyLine(halfSize, halfSize, -halfSize, -halfSize, halfSize, -halfSize);
    drawWobblyLine(-halfSize, halfSize, -halfSize, -halfSize, halfSize, halfSize);


            drawWobblyLine(-halfSize, -halfSize, halfSize, -halfSize, halfSize, halfSize);
    drawWobblyLine(halfSize, -halfSize, halfSize, halfSize, halfSize, halfSize);
    drawWobblyLine(halfSize, -halfSize, -halfSize, halfSize, halfSize, -halfSize);
    drawWobblyLine(-halfSize, -halfSize, -halfSize, -halfSize, halfSize, -halfSize);



                for (let i = 1; i < divisions; i++) {
        const x = -halfSize + (size / divisions) * i;


                        drawWobblyLine(x, -halfSize, halfSize, x, halfSize, halfSize);
        drawWobblyLine(x, -halfSize, -halfSize, x, halfSize, -halfSize);


                        drawWobblyLine(x, -halfSize, -halfSize, x, -halfSize, halfSize);
        drawWobblyLine(x, halfSize, -halfSize, x, halfSize, halfSize);
    }


            for (let i = 1; i < divisions; i++) {
        const y = -halfSize + (size / divisions) * i;


                        drawWobblyLine(-halfSize, y, halfSize, halfSize, y, halfSize);
        drawWobblyLine(-halfSize, y, -halfSize, halfSize, y, -halfSize);


                        drawWobblyLine(-halfSize, y, -halfSize, -halfSize, y, halfSize);
        drawWobblyLine(halfSize, y, -halfSize, halfSize, y, halfSize);
    }


            for (let i = 1; i < divisions; i++) {
        const z = -halfSize + (size / divisions) * i;


                        drawWobblyLine(-halfSize, -halfSize, z, halfSize, -halfSize, z);
        drawWobblyLine(-halfSize, halfSize, z, halfSize, halfSize, z);


                        drawWobblyLine(-halfSize, -halfSize, z, -halfSize, halfSize, z);
        drawWobblyLine(halfSize, -halfSize, z, halfSize, halfSize, z);
    }

        pop();
}


function drawPinchGlow(thumbTip, indexTip, color, baseAlpha) {
    push();


            const centerX = (thumbTip.x + indexTip.x) / 2;
    const centerY = (thumbTip.y + indexTip.y) / 2;


            const pulseAmount = sin(millis() * 0.004) * 0.2 + 0.8; 


            noStroke();


            const glowLayers = [
        { size: 120, alpha: 0.05, blur: 20 },
        { size: 90, alpha: 0.08, blur: 15 },
        { size: 70, alpha: 0.12, blur: 12 },
        { size: 50, alpha: 0.18, blur: 8 },
        { size: 35, alpha: 0.25, blur: 5 },
        { size: 25, alpha: 0.35, blur: 3 }
    ];


            for (let layer of glowLayers) {
        push();


                        drawingContext.filter = `blur(${layer.blur}px)`;

                const size = layer.size * pulseAmount;
        const alpha = layer.alpha * baseAlpha * 0.8; 


                        fill(color.r, color.g, color.b, alpha);
        ellipse(centerX, centerY, size, size);

                pop();
    }


            push();
    drawingContext.filter = 'blur(2px)';
    fill(255, 255, 255, baseAlpha * 0.6 * pulseAmount);
    ellipse(centerX, centerY, 15, 15);
    pop();


            stroke(color.r, color.g, color.b, baseAlpha * 0.15 * pulseAmount);
    strokeWeight(2);
    const numRays = 8;
    for (let i = 0; i < numRays; i++) {
        const angle = (TWO_PI / numRays) * i + millis() * 0.001;
        const innerRadius = 20;
        const outerRadius = 60 * pulseAmount;

                const x1 = centerX + cos(angle) * innerRadius;
        const y1 = centerY + sin(angle) * innerRadius;
        const x2 = centerX + cos(angle) * outerRadius;
        const y2 = centerY + sin(angle) * outerRadius;

                line(x1, y1, x2, y2);
    }

        pop();
}

