import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as CameraUtils from 'three/addons/utils/CameraUtils.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';

let camera, scene, renderer, stats;
let cube, curvedPanel, material;

let eyeCamera, eyeRenderTarget, eyeCameraHelper, params = { setFoVToCorners: false, panelCurvature: 20 };

let controls;

init();

function init() {

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setAnimationLoop(animation);
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	document.body.appendChild(renderer.domElement);

	window.addEventListener('resize', onWindowResized);

	stats = new Stats();
	document.body.appendChild(stats.dom);

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.x = 60;
	camera.position.y = 20;
	camera.position.z = 30;
	scene.add(camera);

	new RGBELoader()
		.setPath('textures/equirectangular/')
		.load('quarry_01_1k.hdr', function (texture) {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			scene.background = texture;
			scene.environment = texture;
		});

	//

	eyeRenderTarget = new THREE.WebGLRenderTarget(1024, 576);
	eyeRenderTarget.texture.type = THREE.HalfFloatType;
	eyeRenderTarget.texture.encoding = renderer.outputEncoding;

	eyeCamera = new THREE.PerspectiveCamera(30, 16.0 / 9.0, 1, 100);
	eyeCamera.position.x = 0.0;
	eyeCamera.position.y = 0.0;
	eyeCamera.position.z = 30;
	scene.add(eyeCamera);
	eyeCameraHelper = new THREE.CameraHelper(eyeCamera);
	scene.add(eyeCameraHelper);

	//

	material = new THREE.MeshBasicMaterial({ map: eyeRenderTarget.texture });
	material.uniforms = {
		eyeProjectionMatrix : { value: eyeCamera.projectionMatrix },
		eyeViewMatrix       : { value: eyeCamera.matrixWorldInverse },
		renderToScreen        : { value: false }
	};

	material.onBeforeCompile = (shader) => {

		// Vertex Shader: Set UVs to be eye-camera screen-space; Map positions to be main screen-space.
		shader.vertexShader =
			shader.vertexShader.slice( 0, 18 ) +
			`uniform mat4 eyeProjectionMatrix; uniform mat4 eyeViewMatrix; uniform bool renderToScreen; \n` +
			shader.vertexShader.slice( 18, - 1 ) +
			`	vec4 modelViewLocal = ( modelMatrix * eyeViewMatrix ) * vec4( position.xyz, 1.0 );
				vec4    screenLocal = eyeProjectionMatrix * modelViewLocal;
				vUv                 = ( ( screenLocal.xy / screenLocal.w ) + 1.0 ) * 0.5;
				if ( renderToScreen ) { gl_Position = vec4( ( uv - 0.5 ) * 2.0, 0.0, 1.0 ); } }`;

		// Fragment Shader: Set Colors outside the Eye Frustum to Black
		shader.fragmentShader =
			shader.fragmentShader.slice( 0, - 1 ) +
			`\nbool outsideUV =  max(vUv.x, vUv.y) > 1.0 || min(vUv.x, vUv.y) < 0.0;
			gl_FragColor.rgb = outsideUV ? vec3(0.0, 0.0, 0.0) : gl_FragColor.rgb;
		}`;

		// Set the eye camera's view and projection matrices
		shader.uniforms.eyeViewMatrix       = material.uniforms.eyeViewMatrix;
		shader.uniforms.eyeProjectionMatrix = material.uniforms.eyeProjectionMatrix;
		shader.uniforms.renderToScreen        = material.uniforms.renderToScreen;

	};

	let curvedPanelGeometry = new THREE.PlaneGeometry(50, 20, 16, 16);
	let vertices = curvedPanelGeometry.getAttribute("position").array;
	let tempVec = new THREE.Vector3();
	let radius = tempVec.set(-25, 0, params.panelCurvature).length();
	for (let i = 0; i < vertices.length; i += 3) {
		tempVec.set(vertices[i], 0, -params.panelCurvature).setLength(radius);
		vertices[i] = tempVec.x; vertices[i + 2] = tempVec.z + params.panelCurvature;
	}
	curvedPanel = new THREE.Mesh(curvedPanelGeometry, material);
	scene.add(curvedPanel);

	const gui = new GUI();
	gui.add(renderer, 'toneMappingExposure', 0, 2).name('exposure');
	gui.add(eyeCamera, 'fov', 0, 60);
    gui.add(params, 'panelCurvature', 10, 100).onChange(() => {
        let newCurvedPanelGeometry = new THREE.PlaneGeometry(50, 20, 16, 16);
        let newVertices = newCurvedPanelGeometry.getAttribute("position").array;
        let newRadius = tempVec.set(-25, 0, params.panelCurvature).length();
        for (let i = 0; i < newVertices.length; i += 3) {
            tempVec.set(newVertices[i], 0, -params.panelCurvature).setLength(newRadius);
            newVertices[i] = tempVec.x; newVertices[i + 2] = tempVec.z + params.panelCurvature;
        }
        curvedPanel.geometry = newCurvedPanelGeometry;
    });
	gui.add(params, 'setFoVToCorners', false);
    gui.add(material.uniforms.renderToScreen, 'value', false).name('renderToScreen');

	const material2 = new THREE.MeshStandardMaterial( {
		roughness: 0.1,
		metalness: 0
	} );

	cube = new THREE.Mesh( new THREE.BoxGeometry( 15, 15, 15 ), material2 );
	cube.position.x = 0.0;
	cube.position.y = 0.0;
	cube.position.z = -30;
	scene.add( cube );

	//

	controls = new OrbitControls( camera, renderer.domElement );
}

function onWindowResized() {

	renderer.setSize( window.innerWidth, window.innerHeight );

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

}

function animation( msTime ) {

	const time = msTime / 1000;

	// move the eye's perspective around to make it interesting
	eyeCamera.position.x = Math.cos( time * 0.5 ) * 30;
	eyeCamera.position.y = Math.sin( time * 0.25 ) * 5;
	eyeCamera.position.z = 30 + Math.sin( time ) * 20;
	eyeCamera.lookAt( cube.position );

	// save the original camera properties
	const currentRenderTarget = renderer.getRenderTarget();
	const currentXrEnabled = renderer.xr.enabled;
	const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
	renderer.xr.enabled = false; // Avoid camera modification
	renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

	// set the eye camera's frustum
	if (params.setFoVToCorners) {
		// create an asymmetric/off-axis frustum that aligns to the corners of the curvedPanel
		CameraUtils.frameCorners(eyeCamera,
			new THREE.Vector3(-25, -10, 0),
			new THREE.Vector3( 25, -10, 0),
			new THREE.Vector3(-25,  10, 0), false);
	} else {
		// update the FoV of the eye camera
		eyeCamera.updateProjectionMatrix();
	}

	// set up rendering from the eye's camera
	renderer.setRenderTarget( eyeRenderTarget );
	renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897
	if ( renderer.autoClear === false ) renderer.clear();
	curvedPanel    .visible = false; // hide the curvedPanel from from the eye's camera
	eyeCameraHelper.visible = false;

	// render the eye's perspective to eyeRenderTarget
	renderer.render( scene, eyeCamera );

	// restore the original rendering properties
	curvedPanel    .visible = true;
	eyeCameraHelper.visible = true;
	renderer.xr.enabled = currentXrEnabled;
	renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
	renderer.setRenderTarget( currentRenderTarget );

	eyeCameraHelper.update();

	controls.update();

	renderer.render( scene, camera );

	stats.update();

}
