import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log(THREE);

function main() {

    const canvas = document.querySelector("#c");
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

    const aspect = 2;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);
    camera.position.z = 5;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const scene = new THREE.Scene();

    const light1 = new THREE.DirectionalLight(0xFFFFFF, 1);
    light1.position.set(-1, 2, 4);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xFF0000, 1);
    light2.position.set(2, 3, -3);
    scene.add(light2);

    const light3 = new THREE.SpotLight(0x0000FF, 1);
    light3.position.set(-2, -3, 3);
    scene.add(light3);

    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 16);
    const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);

    function makeInstance(geometry, color, x, y, z) {
        const material = new THREE.MeshPhongMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        cube.position.set(x, y, z);
        return cube;
    }

    function makeTexturedInstance(geometry, x) {
        const loader = new THREE.TextureLoader();
        const materials = [
            new THREE.MeshBasicMaterial({ map: loadColorTexture('Alan.PNG') }),
            new THREE.MeshBasicMaterial({ map: loadColorTexture('Charlie.PNG') }),
            new THREE.MeshBasicMaterial({ map: loadColorTexture('Glep.PNG') }),
            new THREE.MeshBasicMaterial({ map: loadColorTexture('Pim.PNG') }),
            new THREE.MeshBasicMaterial({ map: loadColorTexture('Shrimp.PNG') }),
            new THREE.MeshBasicMaterial({ map: loadColorTexture('Smormu.PNG') }),
        ];

        function loadColorTexture(path) {
            const texture = loader.load(path);
            texture.colorSpace = THREE.SRGBColorSpace;
            return texture;
        }

        const cube = new THREE.Mesh(geometry, materials);
        scene.add(cube);
        cube.position.x = x;
        return cube;
    }

    const cubes = [];

    cubes.push(makeTexturedInstance(geometry, 0));
    cubes.push(makeInstance(sphereGeometry, 0xaa8844, -2, 0, 0));
    cubes.push(makeInstance(cylinderGeometry, 0x8844aa, 2, 0, 0));

    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        const color = Math.random() * 0xffffff;
        cubes.push(makeInstance(geometry, color, x, y, z));
    }

    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();
    mtlLoader.load('iphone X.mtl', (mtl) => {
        mtl.preload();
        objLoader.setMaterials(mtl);
        objLoader.load('iphone X.obj', (root) => {
            root.scale.set(0.5, 0.5, 0.5);
            root.position.z -= 1;
            root.position.y += 0.2;
            scene.add(root);
        });
    });

    const loader = new THREE.TextureLoader();
    const texture = loader.load('images.jpg', () => {
        const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
        rt.fromEquirectangularTexture(renderer, texture);
        scene.background = rt.texture;
    });

    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const lasers = [];

    function createLaser() {
        const laserGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 32);
        const laserMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        laser.rotation.z = Math.PI / 2;

        const startX = (Math.random() - 0.5) * 20;
        const startY = (Math.random() - 0.5) * 20;
        const startZ = (Math.random() - 0.5) * 20;
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();

        laser.position.set(startX, startY, startZ);
        laser.userData.velocity = direction.multiplyScalar(0.5); // Speed of the laser
        scene.add(laser);
        lasers.push(laser);
    }

    function updateLasers() {
        lasers.forEach((laser, index) => {
            laser.position.add(laser.userData.velocity);

            if (Math.abs(laser.position.x) > 10 || Math.abs(laser.position.y) > 10 || Math.abs(laser.position.z) > 10) {
                scene.remove(laser);
                lasers.splice(index, 1);
            }
        });

        if (lasers.length < 20) {
            createLaser();
        }
    }

    const lightnings = [];
    const lightningLifetime = 200; // milliseconds

    function createLightning() {
        const lightningMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const lightningGeometry = new THREE.BufferGeometry();
        const positions = [];

        const startX = (Math.random() - 0.5) * 10;
        const startY = 5;
        const startZ = (Math.random() - 0.5) * 10;

        positions.push(startX, startY, startZ);

        let currentX = startX;
        let currentY = startY;
        let currentZ = startZ;

        for (let i = 0; i < 10; i++) {
            currentX += (Math.random() - 0.5) * 2;
            currentY -= Math.random() * 2;
            currentZ += (Math.random() - 0.5) * 2;
            positions.push(currentX, currentY, currentZ);
        }

        lightningGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const lightning = new THREE.Line(lightningGeometry, lightningMaterial);
        lightning.userData.birthTime = Date.now();

        scene.add(lightning);
        lightnings.push(lightning);
    }

    function updateLightnings() {
        const currentTime = Date.now();
        lightnings.forEach((lightning, index) => {
            if (currentTime - lightning.userData.birthTime > lightningLifetime) {
                scene.remove(lightning);
                lightnings.splice(index, 1);
            }
        });

        if (lightnings.length < 5 && Math.random() < 0.05) { // Random chance to create lightning
            createLightning();
        }
    }

    function render(time) {
        time *= 0.001;

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        updateLasers();
        updateLightnings();

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
