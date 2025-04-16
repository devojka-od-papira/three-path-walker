import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { VisualPathWalker } from './visualPathWalker';
import { Map2D } from './map2d';

// First example map from README
const map: string[][] = [
    '  @---A---+'.split(''),
    '          |'.split(''),
    '  x-B-+   C'.split(''),
    '      |   |'.split(''),
    '      +---+'.split('')
];

// Calculate map dimensions
const mapWidth = Math.max(...map.map(row => row.length));
const mapHeight = map.length;

// Initialize 2D map
const map2d = new Map2D('map2d-container', map);

// Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');

const gameContainer = document.getElementById('game-container')!;
const containerWidth = gameContainer.clientWidth * 1;
const containerHeight = window.innerHeight * 1;

const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
camera.position.set(mapWidth/2 + 2, mapHeight + 5, mapHeight + 5);
camera.lookAt(mapWidth/2, 0, -mapHeight/2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(containerWidth, containerHeight);
gameContainer.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI / 2;
controls.target.set(mapWidth/2, 0, -mapHeight/2);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Create warning light
const warningLight = new THREE.PointLight(0xff0000, 0, 5);
warningLight.position.set(0, 5, 0);
scene.add(warningLight);

// Grid helper - match exact map dimensions
const gridHelper = new THREE.GridHelper(mapWidth, mapWidth);
gridHelper.position.set(mapWidth/2, -0.1, -mapHeight/2);
scene.add(gridHelper);

// Create path geometry
const pathGeometry = new THREE.BoxGeometry(1, 0.1, 1);
const pathMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x666666,
    metalness: 0.1,
    roughness: 0.7,
    emissive: 0x333333,
    emissiveIntensity: 0.1
});
const pathMesh = new THREE.InstancedMesh(pathGeometry, pathMaterial, mapWidth * mapHeight);
scene.add(pathMesh);

// Create path instances
let instanceCount = 0;
for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
        const char = map[y][x];
        if (char === '-' || char === '|' || char === '+' || char === '@' || char === 'x' || /[A-Z]/.test(char)) {
            const matrix = new THREE.Matrix4();
            matrix.makeTranslation(x, 0, -y);
            pathMesh.setMatrixAt(instanceCount++, matrix);
        }
    }
}
pathMesh.count = instanceCount;

// Add subtle grid lines to the path
const gridLinesGeometry = new THREE.BufferGeometry();
const gridLinesMaterial = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
const gridLines = new THREE.LineSegments(gridLinesGeometry, gridLinesMaterial);
scene.add(gridLines);

// Update grid lines based on path
const gridLinesPositions: number[] = [];
for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
        const char = map[y][x];
        if (char === '-' || char === '|' || char === '+' || char === '@' || char === 'x' || /[A-Z]/.test(char)) {
            // Add horizontal lines
            gridLinesPositions.push(x - 0.5, 0.1, -y);
            gridLinesPositions.push(x + 0.5, 0.1, -y);
            // Add vertical lines
            gridLinesPositions.push(x, 0.1, -y - 0.5);
            gridLinesPositions.push(x, 0.1, -y + 0.5);
        }
    }
}
gridLinesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridLinesPositions, 3));

// Create walker
const walkerGeometry = new THREE.SphereGeometry(0.8, 32, 32);
const walkerMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 0.3
});
const walker = new THREE.Mesh(walkerGeometry, walkerMaterial);
scene.add(walker);

// Create direction indicators
const redDirectionIndicator = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    0xff0000
);
scene.add(redDirectionIndicator);

const greenDirectionIndicator = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1.5,
    0x00ff00
);
scene.add(greenDirectionIndicator);

// Create letter meshes
const letterMeshes: THREE.Mesh[] = [];
const endPointMesh: THREE.Mesh[] = [];

// Load font and create letters
const fontLoader = new FontLoader();

// UI elements
const lettersDisplay = document.createElement('div');
lettersDisplay.style.position = 'absolute';
lettersDisplay.style.top = '60px';
lettersDisplay.style.right = '20px';
lettersDisplay.style.color = 'white';
lettersDisplay.style.fontSize = '20px';
document.body.appendChild(lettersDisplay);

const pathDisplay = document.createElement('div');
pathDisplay.style.position = 'absolute';
pathDisplay.style.top = '100px';
pathDisplay.style.right = '20px';
pathDisplay.style.color = 'white';
pathDisplay.style.fontSize = '20px';
document.body.appendChild(pathDisplay);

// Create warning message
const warningMessage = document.createElement('div');
warningMessage.style.position = 'absolute';
warningMessage.style.top = '50%';
warningMessage.style.left = '50%';
warningMessage.style.transform = 'translate(-50%, -50%)';
warningMessage.style.color = 'red';
warningMessage.style.fontSize = '48px';
warningMessage.style.fontWeight = 'bold';
warningMessage.style.textShadow = '0 0 10px red';
warningMessage.style.opacity = '0';
warningMessage.style.transition = 'opacity 0.3s';
warningMessage.textContent = 'WRONG MOVE!';
document.body.appendChild(warningMessage);

// Create audio context for sound effects
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
let warningSound: AudioBuffer;
let victorySound: AudioBuffer;

// Load sound effects
Promise.all([
    fetch('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            warningSound = audioBuffer;
        }),
    fetch('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            victorySound = audioBuffer;
        })
]);

// Function to play warning sound
function playWarningSound() {
    if (!warningSound) return;
    
    const source = audioContext.createBufferSource();
    source.buffer = warningSound;
    source.connect(audioContext.destination);
    source.start(0);
}

// Function to play victory sound
function playVictorySound() {
    if (!victorySound) return;
    
    const source = audioContext.createBufferSource();
    source.buffer = victorySound;
    source.connect(audioContext.destination);
    source.start(0);
}

// Function to show warning effect
function showWarningEffect() {
    const warningMessage = document.createElement('div');
    warningMessage.style.position = 'absolute';
    warningMessage.style.top = '50%';
    warningMessage.style.left = '50%';
    warningMessage.style.transform = 'translate(-50%, -50%)';
    warningMessage.style.color = '#ff0000';
    warningMessage.style.fontSize = '32px';
    warningMessage.style.fontWeight = 'bold';
    warningMessage.style.textShadow = '0 0 5px #ff0000';
    warningMessage.style.opacity = '0';
    warningMessage.style.transition = 'opacity 0.3s';
    warningMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    warningMessage.style.padding = '15px 30px';
    warningMessage.style.borderRadius = '6px';
    warningMessage.style.border = '1px solid #ff0000';
    warningMessage.textContent = 'WRONG MOVE!';
    document.body.appendChild(warningMessage);

    warningMessage.style.opacity = '1';
    setTimeout(() => {
        warningMessage.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(warningMessage);
        }, 300);
    }, 1000);
}

// Function to show victory effect
function showVictoryEffect() {
    const victoryMessage = document.createElement('div');
    victoryMessage.style.position = 'absolute';
    victoryMessage.style.top = '50%';
    victoryMessage.style.left = '50%';
    victoryMessage.style.transform = 'translate(-50%, -50%)';
    victoryMessage.style.color = '#4CAF50';
    victoryMessage.style.fontSize = '32px';
    victoryMessage.style.fontWeight = 'bold';
    victoryMessage.style.textShadow = '0 0 5px #4CAF50';
    victoryMessage.style.opacity = '0';
    victoryMessage.style.transition = 'opacity 0.3s';
    victoryMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    victoryMessage.style.padding = '15px 30px';
    victoryMessage.style.borderRadius = '6px';
    victoryMessage.style.border = '1px solid #4CAF50';
    victoryMessage.textContent = 'VICTORY!';
    document.body.appendChild(victoryMessage);

    // Show victory message
    victoryMessage.style.opacity = '1';
    setTimeout(() => {
        victoryMessage.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(victoryMessage);
        }, 300);
    }, 3000);

    // Enhanced confetti effect with smaller particles
    const confettiCount = 120;
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'absolute';
        confetti.style.width = `${Math.random() * 6 + 3}px`;
        confetti.style.height = `${Math.random() * 6 + 3}px`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = '-10px';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.animation = `confetti-fall ${Math.random() * 2 + 1}s linear forwards`;
        confetti.style.borderRadius = '50%';
        confetti.style.boxShadow = '0 0 3px rgba(255,255,255,0.5)';
        document.body.appendChild(confetti);

        // Add smaller sparkle effect
        const sparkle = document.createElement('div');
        sparkle.style.position = 'absolute';
        sparkle.style.width = '1px';
        sparkle.style.height = '1px';
        sparkle.style.backgroundColor = 'white';
        sparkle.style.borderRadius = '50%';
        sparkle.style.boxShadow = '0 0 2px white';
        sparkle.style.animation = 'sparkle 0.5s ease-in-out infinite';
        confetti.appendChild(sparkle);

        setTimeout(() => {
            document.body.removeChild(confetti);
        }, 3000);
    }

    // Add confetti and sparkle animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confetti-fall {
            0% { 
                transform: translateY(0) rotate(0deg) scale(1);
                opacity: 1;
            }
            100% { 
                transform: translateY(100vh) rotate(360deg) scale(0.5);
                opacity: 0;
            }
        }
        @keyframes sparkle {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Create visual path walker
let visualWalker: VisualPathWalker;

// Load font and create letters
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    const letterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        metalness: 0.3,
        roughness: 0.2,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });
    
    // Find all letters in the map
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const char = map[y][x];
            if (/[A-Z]/.test(char)) {
                const textGeometry = new TextGeometry(char, {
                    font: font,
                    size: 2.0,
                    depth: 0.2,
                    curveSegments: 4,
                    bevelEnabled: false,
                });
                textGeometry.center();
                
                const letterMesh = new THREE.Mesh(textGeometry, letterMaterial.clone());
                letterMesh.position.set(x, 1.0, -y);
                letterMesh.userData.letter = char;
                scene.add(letterMesh);
                letterMeshes.push(letterMesh);

                // Add a stronger point light to highlight the letter
                const letterLight = new THREE.PointLight(0xff0000, 1.2, 4);
                letterLight.position.copy(letterMesh.position);
                scene.add(letterLight);
            } else if (char === 'x') {
                // Create a special effect for the end point
                const endGeometry = new TextGeometry('X', {
                    font: font,
                    size: 1.6,
                    depth: 0.15,
                    curveSegments: 4,
                    bevelEnabled: false,
                });
                endGeometry.center();
                
                const endMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xFF9800,
                    metalness: 0.5,
                    roughness: 0.2,
                    emissive: 0xFF9800,
                    emissiveIntensity: 0.5
                });
                
                const endMesh = new THREE.Mesh(endGeometry, endMaterial);
                endMesh.position.set(x, 0.9, -y);
                scene.add(endMesh);
                endPointMesh.push(endMesh);

                // Add a pulsing point light
                const endLight = new THREE.PointLight(0xFF9800, 1, 4);
                endLight.position.copy(endMesh.position);
                scene.add(endLight);

                // Enhanced particle system
                const particleCount = 80;
                const particles = new THREE.BufferGeometry();
                const particlePositions = new Float32Array(particleCount * 3);
                const particleMaterial = new THREE.PointsMaterial({
                    color: 0xFF9800,
                    size: 0.15,
                    transparent: true,
                    opacity: 0.8,
                    blending: THREE.AdditiveBlending
                });

                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    particlePositions[i3] = x + (Math.random() - 0.5) * 3;
                    particlePositions[i3 + 1] = 1.0 + Math.random() * 3;
                    particlePositions[i3 + 2] = -y + (Math.random() - 0.5) * 3;
                }

                particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
                const particleSystem = new THREE.Points(particles, particleMaterial);
                scene.add(particleSystem);

                // Enhanced particle animation
                const animateParticles = () => {
                    const positions = particles.attributes.position.array;
                    for (let i = 0; i < positions.length; i += 3) {
                        positions[i] += (Math.random() - 0.5) * 0.02;
                        positions[i + 1] += 0.02 + Math.random() * 0.02;
                        positions[i + 2] += (Math.random() - 0.5) * 0.02;
                        
                        if (positions[i + 1] > 4.0) {
                            positions[i] = x + (Math.random() - 0.5) * 3;
                            positions[i + 1] = 1.0;
                            positions[i + 2] = -y + (Math.random() - 0.5) * 3;
                        }
                    }
                    particles.attributes.position.needsUpdate = true;
                };

                // Add to animation loop
                const animate = () => {
                    requestAnimationFrame(animate);
                    animateParticles();
                    renderer.render(scene, camera);
                };
                animate();
            }
        }
    }

    // Initialize visual path walker
    visualWalker = new VisualPathWalker(
        map,
        (position, letters, path, direction) => {
            // Update 3D walker position
            walker.position.set(position.x, 0.5, -position.y);
            
            // Update direction indicators
            let directionVector = new THREE.Vector3(1, 0, 0);
            switch (direction) {
                case 'up':
                    directionVector = new THREE.Vector3(0, 0, -1);
                    break;
                case 'down':
                    directionVector = new THREE.Vector3(0, 0, 1);
                    break;
                case 'left':
                    directionVector = new THREE.Vector3(-1, 0, 0);
                    break;
                case 'right':
                    directionVector = new THREE.Vector3(1, 0, 0);
                    break;
            }
            
            // Update red arrow (current direction)
            redDirectionIndicator.setDirection(directionVector);
            redDirectionIndicator.position.copy(walker.position);
            
            // Update green arrow (correct direction)
            greenDirectionIndicator.setDirection(directionVector);
            greenDirectionIndicator.position.copy(walker.position);
            greenDirectionIndicator.position.y += 0.5;
            
            // Update 2D map
            map2d.update(position, letters, path, direction);
            
            // Update letter colors
            letterMeshes.forEach(mesh => {
                const letter = mesh.userData.letter;
                if (letters.includes(letter)) {
                    (mesh.material as THREE.MeshStandardMaterial).color.set(0x00ff00);
                }
            });

            // Check for victory condition
            const currentChar = map[position.y][position.x];
            const expectedPath = '@---A---+|C|+---+|+-B-x';
            const expectedLetters = 'ACB';
            
            if (currentChar === 'x' && path === expectedPath && letters === expectedLetters) {
                playVictorySound();
                showVictoryEffect();
            }
        },
        () => {
            // Handle wrong move
            playWarningSound();
            showWarningEffect();
        }
    );
});

// Handle keyboard controls
document.addEventListener('keydown', (event) => {
    if (!visualWalker) return;
    
    let direction: 'up' | 'down' | 'left' | 'right' | null = null;
    
    switch (event.key) {
        case 'ArrowUp':
            direction = 'up';
            break;
        case 'ArrowDown':
            direction = 'down';
            break;
        case 'ArrowLeft':
            direction = 'left';
            break;
        case 'ArrowRight':
            direction = 'right';
            break;
    }

    if (direction) {
        visualWalker.move(direction);
    }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = window.innerHeight;
    
    camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
    renderer.setSize(containerWidth, containerHeight);
});

