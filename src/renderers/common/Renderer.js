import Animation from './Animation.js';
import RenderObjects from './RenderObjects.js';
import Attributes from './Attributes.js';
import Geometries from './Geometries.js';
import Info from './Info.js';
import Pipelines from './Pipelines.js';
import Bindings from './Bindings.js';
import RenderLists from './RenderLists.js';
import RenderContexts from './RenderContexts.js';
import Textures from './Textures.js';
import Background from './Background.js';
import Nodes from './nodes/Nodes.js';
import Color4 from './Color4.js';
import ClippingContext from './ClippingContext.js';
import QuadMesh from './QuadMesh.js';
import RenderBundles from './RenderBundles.js';
import CanvasRenderTarget from './CanvasRenderTarget.js';

import { NodeMaterial } from '../../nodes/Nodes.js';

import { Scene } from '../../scenes/Scene.js';
import { Frustum } from '../../math/Frustum.js';
import { Matrix4 } from '../../math/Matrix4.js';
import { Vector2 } from '../../math/Vector2.js';
import { Vector3 } from '../../math/Vector3.js';
import { Vector4 } from '../../math/Vector4.js';
import { RenderTarget } from '../../core/RenderTarget.js';
import { DoubleSide, BackSide, FrontSide, NoColorSpace, NoToneMapping, LinearFilter, LinearSRGBColorSpace, HalfFloatType, RGBAFormat } from '../../constants.js';

const _scene = /*@__PURE__*/ new Scene();
const _drawingBufferSize = /*@__PURE__*/ new Vector2();
const _screen = /*@__PURE__*/ new Vector4();
const _frustum = /*@__PURE__*/ new Frustum();
const _projScreenMatrix = /*@__PURE__*/ new Matrix4();
const _vector3 = /*@__PURE__*/ new Vector3();

class Renderer {

	constructor( backend, parameters = {} ) {

		this.isRenderer = true;

		//

		const {
			logarithmicDepthBuffer = false,
			alpha = true,
			antialias = false,
			samples = 0
		} = parameters;

		// public
		this.domElement = backend.getDomElement();

		this.backend = backend;

		this.samples = samples || ( antialias === true ) ? 4 : 0;

		this.autoClear = true;
		this.autoClearColor = true;
		this.autoClearDepth = true;
		this.autoClearStencil = true;

		this.alpha = alpha;

		this.logarithmicDepthBuffer = logarithmicDepthBuffer;

		this.toneMapping = NoToneMapping;
		this.toneMappingExposure = 1.0;

		this.sortObjects = true;

		this.clippingPlanes = [];

		this.info = new Info();

		// internals

		this._attributes = null;
		this._geometries = null;
		this._nodes = null;
		this._animation = null;
		this._bindings = null;
		this._objects = null;
		this._pipelines = null;
		this._bundles = null;
		this._renderLists = null;
		this._renderContexts = null;
		this._textures = null;
		this._background = null;

		this._quad = new QuadMesh( new NodeMaterial() );

		this._defaultCanvasRenderTarget = new CanvasRenderTarget( Object.assign( {}, parameters, { domElement: this.domElement } ) );

		this._activeCanvas = null;
		this._currentRenderContext = null;

		this._opaqueSort = null;
		this._transparentSort = null;

		this._frameBufferTarget = null;

		const alphaClear = this.alpha === true ? 0 : 1;

		this._clearColor = new Color4( 0, 0, 0, alphaClear );
		this._clearDepth = 1;
		this._clearStencil = 0;

		this._renderTarget = this._defaultCanvasRenderTarget;
		this._activeCubeFace = 0;
		this._activeMipmapLevel = 0;

		this._mrt = null;

		this._renderObjectFunction = null;
		this._currentRenderObjectFunction = null;
		this._currentRenderBundle = null;

		this._handleObjectFunction = this._renderObjectDirect;

		this._initialized = false;
		this._initPromise = null;

		this._compilationPromises = null;

		// backwards compatibility

		this.shadowMap = {
			enabled: false,
			type: null
		};

		this.xr = {
			enabled: false
		};

		this.debug = {
			checkShaderErrors: true,
			onShaderError: null
		};

	}

	async init() {

		if ( this._initialized ) {

			throw new Error( 'Renderer: Backend has already been initialized.' );

		}

		if ( this._initPromise !== null ) {

			return this._initPromise;

		}

		this._initPromise = new Promise( async ( resolve, reject ) => {

			const backend = this.backend;

			try {

				await backend.init( this );

			} catch ( error ) {

				reject( error );
				return;

			}

			this._nodes = new Nodes( this, backend );
			this._animation = new Animation( this._nodes, this.info );
			this._attributes = new Attributes( backend );
			this._background = new Background( this, this._nodes );
			this._geometries = new Geometries( this._attributes, this.info );
			this._textures = new Textures( this, backend, this.info );
			this._pipelines = new Pipelines( backend, this._nodes );
			this._bindings = new Bindings( backend, this._nodes, this._textures, this._attributes, this._pipelines, this.info );
			this._objects = new RenderObjects( this, this._nodes, this._geometries, this._pipelines, this._bindings, this.info );
			this._renderLists = new RenderLists();
			this._bundles = new RenderBundles();
			this._renderContexts = new RenderContexts();

			//

			this._initialized = true;

			resolve();

		} );

		return this._initPromise;

	}

	get coordinateSystem() {

		return this.backend.coordinateSystem;

	}

	async compileAsync( scene, camera, targetScene = null ) {

		if ( this._initialized === false ) await this.init();

		// preserve render tree

		const nodeFrame = this._nodes.nodeFrame;

		const previousRenderId = nodeFrame.renderId;
		const previousRenderContext = this._currentRenderContext;
		const previousRenderObjectFunction = this._currentRenderObjectFunction;
		const previousCompilationPromises = this._compilationPromises;

		//

		const sceneRef = ( scene.isScene === true ) ? scene : _scene;

		if ( targetScene === null ) targetScene = scene;

		const renderTarget = this._renderTarget;
		const renderContext = this._renderContexts.get( targetScene, camera, renderTarget );
		const activeMipmapLevel = this._activeMipmapLevel;

		const compilationPromises = [];

		this._currentRenderContext = renderContext;
		this._currentRenderObjectFunction = this.renderObject;

		this._handleObjectFunction = this._createObjectPipeline;

		this._compilationPromises = compilationPromises;

		nodeFrame.renderId ++;

		//

		nodeFrame.update();

		//

		renderContext.depth = renderTarget.depth;
		renderContext.stencil = renderTarget.stencil;

		if ( ! renderContext.clippingContext ) renderContext.clippingContext = new ClippingContext();
		renderContext.clippingContext.updateGlobal( this, camera );

		//

		sceneRef.onBeforeRender( this, scene, camera, renderTarget );

		//

		const renderList = this._renderLists.get( scene, camera );
		renderList.begin();

		this._projectObject( scene, camera, 0, renderList );

		// include lights from target scene
		if ( targetScene !== scene ) {

			targetScene.traverseVisible( function ( object ) {

				if ( object.isLight && object.layers.test( camera.layers ) ) {

					renderList.pushLight( object );

				}

			} );

		}

		renderList.finish();

		//

		if ( renderTarget.isCanvasRenderTarget ) {

			renderContext.textures = null;
			renderContext.depthTexture = null;

		} else {

			this._textures.updateRenderTarget( renderTarget, activeMipmapLevel );

			const renderTargetData = this._textures.get( renderTarget );

			renderContext.textures = renderTargetData.textures;
			renderContext.depthTexture = renderTargetData.depthTexture;

		}

		//

		this._nodes.updateScene( sceneRef );

		//

		this._background.update( sceneRef, renderList, renderContext );

		// process render lists

		const opaqueObjects = renderList.opaque;
		const transparentObjects = renderList.transparent;
		const lightsNode = renderList.lightsNode;

		if ( opaqueObjects.length > 0 ) this._renderObjects( opaqueObjects, camera, sceneRef, lightsNode );
		if ( transparentObjects.length > 0 ) this._renderObjects( transparentObjects, camera, sceneRef, lightsNode );

		// restore render tree

		nodeFrame.renderId = previousRenderId;

		this._currentRenderContext = previousRenderContext;
		this._currentRenderObjectFunction = previousRenderObjectFunction;
		this._compilationPromises = previousCompilationPromises;

		this._handleObjectFunction = this._renderObjectDirect;

		// wait for all promises setup by backends awaiting compilation/linking/pipeline creation to complete

		await Promise.all( compilationPromises );

	}

	async renderAsync( scene, camera ) {

		if ( this._initialized === false ) await this.init();

		const renderContext = this._renderScene( scene, camera );

		await this.backend.resolveTimestampAsync( renderContext, 'render' );

	}

	setMRT( mrt ) {

		this._mrt = mrt;

		return this;

	}

	getMRT() {

		return this._mrt;

	}

	_renderBundle( bundle, sceneRef, lightsNode ) {

		const { object, camera, renderList } = bundle;

		const renderContext = this._currentRenderContext;
		const renderContextData = this.backend.get( renderContext );

		//

		const renderBundle = this._bundles.get( object, camera );

		const renderBundleData = this.backend.get( renderBundle );
		if ( renderBundleData.renderContexts === undefined ) renderBundleData.renderContexts = new Set();

		//

		const renderBundleNeedsUpdate = renderBundleData.renderContexts.has( renderContext ) === false || object.needsUpdate === true;

		renderBundleData.renderContexts.add( renderContext );

		if ( renderBundleNeedsUpdate ) {

			if ( renderContextData.renderObjects === undefined || object.needsUpdate === true ) {

				const nodeFrame = this._nodes.nodeFrame;

				renderContextData.renderObjects = [];
				renderContextData.renderBundles = [];
				renderContextData.scene = sceneRef;
				renderContextData.camera = camera;
				renderContextData.renderId = nodeFrame.renderId;

				renderContextData.registerBundlesPhase = true;

			}

			this._currentRenderBundle = renderBundle;

			const opaqueObjects = renderList.opaque;

			if ( opaqueObjects.length > 0 ) this._renderObjects( opaqueObjects, camera, sceneRef, lightsNode );

			this._currentRenderBundle = null;

			//

			object.needsUpdate = false;

		} else {

			const renderContext = this._currentRenderContext;
			const renderContextData = this.backend.get( renderContext );

			for ( let i = 0, l = renderContextData.renderObjects.length; i < l; i ++ ) {

				const renderObject = renderContextData.renderObjects[ i ];

				this._nodes.updateBefore( renderObject );

				//

				renderObject.object.modelViewMatrix.multiplyMatrices( camera.matrixWorldInverse, renderObject.object.matrixWorld );
				renderObject.object.normalMatrix.getNormalMatrix( renderObject.object.modelViewMatrix );

				this._nodes.updateForRender( renderObject );
				this._bindings.updateForRender( renderObject );

				this.backend.draw( renderObject, this.info );

				this._nodes.updateAfter( renderObject );

			}

		}

	}

	render( scene, camera ) {

		if ( this._initialized === false ) {

			console.warn( 'THREE.Renderer: .render() called before the backend is initialized. Try using .renderAsync() instead.' );

			return this.renderAsync( scene, camera );

		}

		this._renderScene( scene, camera );

	}

	_getFrameBufferTarget() {

		const { currentColorSpace } = this;

		const renderTarget = this._renderTarget;

		const useToneMapping = renderTarget.isCanvasRenderTarget === true && ( this.toneMapping !== NoToneMapping );
		const useColorSpace = currentColorSpace !== LinearSRGBColorSpace && currentColorSpace !== NoColorSpace;

		if ( useToneMapping === false && useColorSpace === false ) return null;

		const { width, height } = renderTarget.getDrawingBufferSize( _drawingBufferSize );
		const { depth, stencil } = renderTarget;

		let frameBufferTarget = this._frameBufferTarget;

		if ( frameBufferTarget === null ) {

			frameBufferTarget = new RenderTarget( width, height, {
				depthBuffer: depth,
				stencilBuffer: stencil,
				type: HalfFloatType, // FloatType
				format: RGBAFormat,
				colorSpace: LinearSRGBColorSpace,
				generateMipmaps: false,
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				samples: this.samples
			} );

			frameBufferTarget.isPostProcessingRenderTarget = true;

			this._frameBufferTarget = frameBufferTarget;

		}

		frameBufferTarget.depthBuffer = depth;
		frameBufferTarget.stencilBuffer = stencil;
		frameBufferTarget.setSize( width, height );
		frameBufferTarget.viewport.copy( renderTarget.viewport );
		frameBufferTarget.scissor.copy( renderTarget.scissor );
		frameBufferTarget.scissorTest = renderTarget.scissorTest;
		frameBufferTarget.viewport.multiplyScalar( renderTarget.pixelRatio );
		frameBufferTarget.scissor.multiplyScalar( renderTarget.pixelRatio );

		return frameBufferTarget;

	}

	_renderScene( scene, camera, useFrameBufferTarget = true ) {

		const frameBufferTarget = useFrameBufferTarget ? this._getFrameBufferTarget() : null;

		// preserve render tree

		const nodeFrame = this._nodes.nodeFrame;

		const previousRenderId = nodeFrame.renderId;
		const previousRenderContext = this._currentRenderContext;
		const previousRenderObjectFunction = this._currentRenderObjectFunction;

		//

		const sceneRef = ( scene.isScene === true ) ? scene : _scene;

		const outputRenderTarget = this._renderTarget;
		const activeCubeFace = this._activeCubeFace;
		const activeMipmapLevel = this._activeMipmapLevel;

		//

		let renderTarget;

		if ( frameBufferTarget !== null ) {

			renderTarget = frameBufferTarget;

			this.setRenderTarget( renderTarget );

		} else {

			renderTarget = outputRenderTarget;

		}

		//

		const renderContext = this._renderContexts.get( scene, camera, renderTarget );

		this._currentRenderContext = renderContext;
		this._currentRenderObjectFunction = this._renderObjectFunction || this.renderObject;


		//

		this.info.calls ++;
		this.info.render.calls ++;
		this.info.render.frameCalls ++;

		nodeFrame.renderId = this.info.calls;

		//

		const coordinateSystem = this.coordinateSystem;

		if ( camera.coordinateSystem !== coordinateSystem ) {

			camera.coordinateSystem = coordinateSystem;

			camera.updateProjectionMatrix();

		}

		//

		if ( scene.matrixWorldAutoUpdate === true ) scene.updateMatrixWorld();

		if ( camera.parent === null && camera.matrixWorldAutoUpdate === true ) camera.updateMatrixWorld();

		//

		const viewport = renderTarget.viewport;
		const scissor = renderTarget.scissor;
		const pixelRatio = renderTarget.pixelRatio ? renderTarget.pixelRatio : 1;

		this._defaultCanvasRenderTarget.getDrawingBufferSize( _drawingBufferSize );

		_screen.set( 0, 0, _drawingBufferSize.width, _drawingBufferSize.height );

		const minDepth = ( viewport.minDepth === undefined ) ? 0 : viewport.minDepth;
		const maxDepth = ( viewport.maxDepth === undefined ) ? 1 : viewport.maxDepth;

		renderContext.viewportValue.copy( viewport ).multiplyScalar( pixelRatio ).floor();
		renderContext.viewportValue.width >>= activeMipmapLevel;
		renderContext.viewportValue.height >>= activeMipmapLevel;
		renderContext.viewportValue.minDepth = minDepth;
		renderContext.viewportValue.maxDepth = maxDepth;
		renderContext.viewport = renderContext.viewportValue.equals( _screen ) === false;

		renderContext.scissorValue.copy( scissor ).multiplyScalar( pixelRatio ).floor();
		renderContext.scissor = renderTarget._scissorTest && renderContext.scissorValue.equals( _screen ) === false;
		renderContext.scissorValue.width >>= activeMipmapLevel;
		renderContext.scissorValue.height >>= activeMipmapLevel;

		if ( ! renderContext.clippingContext ) renderContext.clippingContext = new ClippingContext();
		renderContext.clippingContext.updateGlobal( this, camera );

		//

		sceneRef.onBeforeRender( this, scene, camera, renderTarget );

		//

		_projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
		_frustum.setFromProjectionMatrix( _projScreenMatrix, coordinateSystem );

		const renderList = this._renderLists.get( scene, camera );
		renderList.begin();

		this._projectObject( scene, camera, 0, renderList );

		renderList.finish();

		if ( this.sortObjects === true ) {

			renderList.sort( this._opaqueSort, this._transparentSort );

		}

		//

		if ( renderTarget.isCanvasRenderTarget ) {

			renderContext.textures = null;
			renderContext.depthTexture = null;
			renderContext.width = renderTarget.domElement.width;
			renderContext.height = renderTarget.domElement.height;

			this._activeCanvas = renderTarget;

		} else {

			this._activeCanvas = this._defaultCanvasRenderTarget;
			this._textures.updateRenderTarget( renderTarget, activeMipmapLevel );

			const renderTargetData = this._textures.get( renderTarget );

			renderContext.textures = renderTargetData.textures;
			renderContext.depthTexture = renderTargetData.depthTexture;
			renderContext.width = renderTargetData.width;
			renderContext.height = renderTargetData.height;

		}

		renderContext.colorSpace = this.currentColorSpace;
		renderContext.renderTarget = renderTarget;
		renderContext.width >>= activeMipmapLevel;
		renderContext.height >>= activeMipmapLevel;
		renderContext.activeCubeFace = activeCubeFace;
		renderContext.activeMipmapLevel = activeMipmapLevel;
		renderContext.occlusionQueryCount = renderList.occlusionQueryCount;

		//

		this._nodes.updateScene( sceneRef );

		//

		this._background.update( sceneRef, renderList, renderContext );

		//

		this.backend.beginRender( renderContext );

		// process render lists

		const opaqueObjects = renderList.opaque;
		const transparentObjects = renderList.transparent;
		const bundles = renderList.bundles;
		const lightsNode = renderList.lightsNode;

		if ( bundles.length > 0 ) this._renderBundles( bundles, sceneRef, lightsNode );
		if ( opaqueObjects.length > 0 ) this._renderObjects( opaqueObjects, camera, sceneRef, lightsNode );
		if ( transparentObjects.length > 0 ) this._renderObjects( transparentObjects, camera, sceneRef, lightsNode );

		// finish render pass

		this.backend.finishRender( renderContext );

		// restore render tree

		nodeFrame.renderId = previousRenderId;

		this._currentRenderContext = previousRenderContext;
		this._currentRenderObjectFunction = previousRenderObjectFunction;

		//

		if ( frameBufferTarget !== null ) {

			this.setRenderTarget( outputRenderTarget, activeCubeFace, activeMipmapLevel );

			const quad = this._quad;

			if ( this._nodes.hasOutputChange( renderTarget.texture ) ) {

				quad.material.fragmentNode = this._nodes.getOutputNode( renderTarget.texture );
				quad.material.needsUpdate = true;

			}

			this._renderScene( quad, quad.camera, false );

		}

		//

		sceneRef.onAfterRender( this, scene, camera, renderTarget );

		//

		return renderContext;

	}

	getMaxAnisotropy() {

		return this.backend.getMaxAnisotropy();

	}

	getActiveCubeFace() {

		return this._activeCubeFace;

	}

	getActiveMipmapLevel() {

		return this._activeMipmapLevel;

	}

	async setAnimationLoop( callback ) {

		if ( this._initialized === false ) await this.init();

		this._animation.setAnimationLoop( callback );

	}

	async getArrayBufferAsync( attribute ) {

		return await this.backend.getArrayBufferAsync( attribute );

	}

	getContext() {

		return this.backend.getContext( this._defaultCanvasRenderTarget );

	}

	getPixelRatio() {

		return this._defaultCanvasRenderTarget.pixelRatio;

	}

	getDrawingBufferSize( target ) {

		return this._defaultCanvasRenderTarget.getDrawingBufferSize( target );

	}

	getActiveCanvasRenderTarget() {

		return this._activeCanvas;

	}

	getSize( target ) {

		return this._defaultCanvasRenderTarget.getSize( target );

	}

	setPixelRatio( value = 1 ) {

		this._defaultCanvasRenderTarget.setPixelRatio( value );

	}

	setDrawingBufferSize( width, height, pixelRatio ) {

		this._defaultCanvasRenderTarget.setDrawingBufferSize( width, height, pixelRatio );

	}

	setSize( width, height, updateStyle = true ) {

		this._defaultCanvasRenderTarget.setSize( width, height, updateStyle );

	}

	setOpaqueSort( method ) {

		this._opaqueSort = method;

	}

	setTransparentSort( method ) {

		this._transparentSort = method;

	}

	getScissor( target ) {

		return this._defaultCanvasRenderTarget.getScissor( target );

	}

	setScissor( x, y, width, height ) {

		this._defaultCanvasRenderTarget.setScissor( x, y, width, height );

	}

	getScissorTest() {

		return this._defaultCanvasRenderTarget.scissorTest;

	}

	setScissorTest( boolean ) {

		this._defaultCanvasRenderTarget.scissorTest = boolean;

		this.backend.setScissorTest( boolean );

	}

	getViewport( target ) {

		return this._defaultCanvasRenderTarget.getViewport( target );

	}

	setViewport( x, y, width, height, minDepth = 0, maxDepth = 1 ) {

		return this._defaultCanvasRenderTarget.setViewport( x, y, width, height, minDepth, maxDepth );

	}

	getClearColor( target ) {

		return target.copy( this._clearColor );

	}

	setClearColor( color, alpha = 1 ) {

		this._clearColor.set( color );
		this._clearColor.a = alpha;

	}

	getClearAlpha() {

		return this._clearColor.a;

	}

	setClearAlpha( alpha ) {

		this._clearColor.a = alpha;

	}

	getClearDepth() {

		return this._clearDepth;

	}

	setClearDepth( depth ) {

		this._clearDepth = depth;

	}

	get depth() {

		return this._defaultCanvasRenderTarget.depth;

	}

	set depth( value ) {

		this._defaultCanvasRenderTarget.depth = value;

	}
	get stencil() {

		return this._defaultCanvasRenderTarget.stencil;

	}

	set stencil( value ) {

		this._defaultCanvasRenderTarget.stencil = value;

	}

	getClearStencil() {

		return this._clearStencil;

	}

	setClearStencil( stencil ) {

		this._clearStencil = stencil;

	}

	isOccluded( object ) {

		const renderContext = this._currentRenderContext;

		return renderContext && this.backend.isOccluded( renderContext, object );

	}

	clear( color = true, depth = true, stencil = true ) {

		if ( this._initialized === false ) {

			console.warn( 'THREE.Renderer: .clear() called before the backend is initialized. Try using .clearAsync() instead.' );

			return this.clearAsync( color, depth, stencil );

		}

		const renderTarget = this._renderTarget.isCanvasRenderTarget === true ? this._getFrameBufferTarget() : this._renderTarget;

		let renderTargetData = null;

		if ( ! renderTarget.isCanvasRenderTarget ) {

			this._textures.updateRenderTarget( renderTarget );

			renderTargetData = this._textures.get( renderTarget );

		}

		this.backend.clear( color, depth, stencil, renderTargetData, renderTarget );

		if ( renderTarget !== null && this._renderTarget.isCanvasRenderTarget === true ) {

			// If a color space transform or tone mapping is required,
			// the clear operation clears the intermediate renderTarget texture, but does not update the screen canvas.

			const quad = this._quad;

			if ( this._nodes.hasOutputChange( renderTarget.texture ) ) {

				quad.material.fragmentNode = this._nodes.getOutputNode( renderTarget.texture );
				quad.material.needsUpdate = true;

			}

			this._renderScene( quad, quad.camera, false );

		}

	}

	clearColor() {

		return this.clear( true, false, false );

	}

	clearDepth() {

		return this.clear( false, true, false );

	}

	clearStencil() {

		return this.clear( false, false, true );

	}

	async clearAsync( color = true, depth = true, stencil = true ) {

		if ( this._initialized === false ) await this.init();

		this.clear( color, depth, stencil );

	}

	clearColorAsync() {

		return this.clearAsync( true, false, false );

	}

	clearDepthAsync() {

		return this.clearAsync( false, true, false );

	}

	clearStencilAsync() {

		return this.clearAsync( false, false, true );

	}

	get outputColorSpace() {

		return this._defaultCanvasRenderTarget.outputColorSpace;

	}

	set outputColorSpace( colorSpace ) {

		this._defaultCanvasRenderTarget.outputColorSpace = colorSpace;

	}

	get currentColorSpace() {

		const renderTarget = this._renderTarget;

		if ( renderTarget.isCanvasRenderTarget ) {

			return renderTarget.outputColorSpace;

		} else {

			const texture = renderTarget.texture;

			return ( Array.isArray( texture ) ? texture[ 0 ] : texture ).colorSpace;

		}

	}

	dispose() {

		this.info.dispose();

		this._animation.dispose();
		this._objects.dispose();
		this._pipelines.dispose();
		this._nodes.dispose();
		this._bindings.dispose();
		this._renderLists.dispose();
		this._renderContexts.dispose();
		this._textures.dispose();

		this.setRenderTarget( null );
		this.setAnimationLoop( null );

	}

	setRenderTarget( renderTarget, activeCubeFace = 0, activeMipmapLevel = 0 ) {

		this._renderTarget = renderTarget === null ? this._defaultCanvasRenderTarget : renderTarget;
		this._activeCubeFace = activeCubeFace;
		this._activeMipmapLevel = activeMipmapLevel;

	}

	getRenderTarget() {

		return this._renderTarget === this._defaultCanvasRenderTarget ? null : this._renderTarget;

	}

	setRenderObjectFunction( renderObjectFunction ) {

		this._renderObjectFunction = renderObjectFunction;

	}

	getRenderObjectFunction() {

		return this._renderObjectFunction;

	}

	async computeAsync( computeNodes ) {

		if ( this._initialized === false ) await this.init();

		const nodeFrame = this._nodes.nodeFrame;

		const previousRenderId = nodeFrame.renderId;

		//

		this.info.calls ++;
		this.info.compute.calls ++;
		this.info.compute.frameCalls ++;

		nodeFrame.renderId = this.info.calls;

		//

		const backend = this.backend;
		const pipelines = this._pipelines;
		const bindings = this._bindings;
		const nodes = this._nodes;

		const computeList = Array.isArray( computeNodes ) ? computeNodes : [ computeNodes ];

		if ( computeList[ 0 ] === undefined || computeList[ 0 ].isComputeNode !== true ) {

			throw new Error( 'THREE.Renderer: .compute() expects a ComputeNode.' );

		}

		backend.beginCompute( computeNodes );

		for ( const computeNode of computeList ) {

			// onInit

			if ( pipelines.has( computeNode ) === false ) {

				const dispose = () => {

					computeNode.removeEventListener( 'dispose', dispose );

					pipelines.delete( computeNode );
					bindings.delete( computeNode );
					nodes.delete( computeNode );

				};

				computeNode.addEventListener( 'dispose', dispose );

				//

				computeNode.onInit( { renderer: this } );

			}

			nodes.updateForCompute( computeNode );
			bindings.updateForCompute( computeNode );

			const computeBindings = bindings.getForCompute( computeNode );
			const computePipeline = pipelines.getForCompute( computeNode, computeBindings );

			backend.compute( computeNodes, computeNode, computeBindings, computePipeline );

		}

		backend.finishCompute( computeNodes );

		await this.backend.resolveTimestampAsync( computeNodes, 'compute' );

		//

		nodeFrame.renderId = previousRenderId;

	}

	async hasFeatureAsync( name ) {

		if ( this._initialized === false ) await this.init();

		return this.backend.hasFeature( name );

	}

	hasFeature( name ) {

		if ( this._initialized === false ) {

			console.warn( 'THREE.Renderer: .hasFeature() called before the backend is initialized. Try using .hasFeatureAsync() instead.' );

			return false;

		}

		return this.backend.hasFeature( name );

	}

	copyFramebufferToTexture( framebufferTexture ) {

		const renderContext = this._currentRenderContext;

		this._textures.updateTexture( framebufferTexture );

		this.backend.copyFramebufferToTexture( framebufferTexture, renderContext );

	}

	copyTextureToTexture( srcTexture, dstTexture, srcRegion = null, dstPosition = null, level = 0 ) {

		this._textures.updateTexture( srcTexture );
		this._textures.updateTexture( dstTexture );

		this.backend.copyTextureToTexture( srcTexture, dstTexture, srcRegion, dstPosition, level );

	}


	readRenderTargetPixelsAsync( renderTarget, x, y, width, height, index = 0 ) {

		return this.backend.copyTextureToBuffer( renderTarget.textures[ index ], x, y, width, height );

	}

	_projectObject( object, camera, groupOrder, renderList ) {

		if ( object.visible === false ) return;

		const visible = object.layers.test( camera.layers );

		if ( visible ) {

			if ( object.isGroup ) {

				groupOrder = object.renderOrder;

			} else if ( object.isLOD ) {

				if ( object.autoUpdate === true ) object.update( camera );

			} else if ( object.isLight ) {

				renderList.pushLight( object );

			} else if ( object.isSprite ) {

				if ( ! object.frustumCulled || _frustum.intersectsSprite( object ) ) {

					if ( this.sortObjects === true ) {

						_vector3.setFromMatrixPosition( object.matrixWorld ).applyMatrix4( _projScreenMatrix );

					}

					const geometry = object.geometry;
					const material = object.material;

					if ( material.visible ) {

						renderList.push( object, geometry, material, groupOrder, _vector3.z, null );

					}

				}

			} else if ( object.isLineLoop ) {

				console.error( 'THREE.Renderer: Objects of type THREE.LineLoop are not supported. Please use THREE.Line or THREE.LineSegments.' );

			} else if ( object.isMesh || object.isLine || object.isPoints ) {

				if ( ! object.frustumCulled || _frustum.intersectsObject( object ) ) {

					const geometry = object.geometry;
					const material = object.material;

					if ( this.sortObjects === true ) {

						if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

						_vector3
							.copy( geometry.boundingSphere.center )
							.applyMatrix4( object.matrixWorld )
							.applyMatrix4( _projScreenMatrix );

					}

					if ( Array.isArray( material ) ) {

						const groups = geometry.groups;

						for ( let i = 0, l = groups.length; i < l; i ++ ) {

							const group = groups[ i ];
							const groupMaterial = material[ group.materialIndex ];

							if ( groupMaterial && groupMaterial.visible ) {

								renderList.push( object, geometry, groupMaterial, groupOrder, _vector3.z, group );

							}

						}

					} else if ( material.visible ) {

						renderList.push( object, geometry, material, groupOrder, _vector3.z, null );

					}

				}

			}

		}

		if ( object.static === true ) {

			const baseRenderList = renderList;

			// replace render list
			renderList = this._renderLists.get( object, camera );

			renderList.begin();

			baseRenderList.pushBundle( {
				object,
				camera,
				renderList,
			} );

			renderList.finish();

		}

		const children = object.children;

		for ( let i = 0, l = children.length; i < l; i ++ ) {

			this._projectObject( children[ i ], camera, groupOrder, renderList );

		}

	}

	_renderBundles( bundles, sceneRef, lightsNode ) {

		for ( const bundle of bundles ) {

			this._renderBundle( bundle, sceneRef, lightsNode );

		}

	}

	_renderObjects( renderList, camera, scene, lightsNode ) {

		// process renderable objects

		const renderTarget = this._renderTarget;

		for ( let i = 0, il = renderList.length; i < il; i ++ ) {

			const renderItem = renderList[ i ];

			// @TODO: Add support for multiple materials per object. This will require to extract
			// the material from the renderItem object and pass it with its group data to renderObject().

			const { object, geometry, material, group } = renderItem;

			if ( camera.isArrayCamera ) {

				const cameras = camera.cameras;

				for ( let j = 0, jl = cameras.length; j < jl; j ++ ) {

					const camera2 = cameras[ j ];

					if ( object.layers.test( camera2.layers ) ) {

						const vp = camera2.viewport;
						const minDepth = ( vp.minDepth === undefined ) ? 0 : vp.minDepth;
						const maxDepth = ( vp.maxDepth === undefined ) ? 1 : vp.maxDepth;

						const viewportValue = this._currentRenderContext.viewportValue;
						viewportValue.copy( vp ).multiplyScalar( renderTarget.pixelRatio ).floor();
						viewportValue.minDepth = minDepth;
						viewportValue.maxDepth = maxDepth;

						this.backend.updateViewport( this._currentRenderContext );

						this._currentRenderObjectFunction( object, scene, camera2, geometry, material, group, lightsNode );

					}

				}

			} else {

				this._currentRenderObjectFunction( object, scene, camera, geometry, material, group, lightsNode );

			}

		}

	}

	renderObject( object, scene, camera, geometry, material, group, lightsNode ) {

		let overridePositionNode;
		let overrideFragmentNode;
		let overrideDepthNode;

		//

		object.onBeforeRender( this, scene, camera, geometry, material, group );

		//

		if ( scene.overrideMaterial !== null ) {

			const overrideMaterial = scene.overrideMaterial;

			if ( material.positionNode && material.positionNode.isNode ) {

				overridePositionNode = overrideMaterial.positionNode;
				overrideMaterial.positionNode = material.positionNode;

			}

			if ( overrideMaterial.isShadowNodeMaterial ) {

				overrideMaterial.side = material.shadowSide === null ? material.side : material.shadowSide;

				if ( material.depthNode && material.depthNode.isNode ) {

					overrideDepthNode = overrideMaterial.depthNode;
					overrideMaterial.depthNode = material.depthNode;

				}


				if ( material.shadowNode && material.shadowNode.isNode ) {

					overrideFragmentNode = overrideMaterial.fragmentNode;
					overrideMaterial.fragmentNode = material.shadowNode;

				}

				if ( this.localClippingEnabled ) {

					if ( material.clipShadows ) {

						if ( overrideMaterial.clippingPlanes !== material.clippingPlanes ) {

							overrideMaterial.clippingPlanes = material.clippingPlanes;
							overrideMaterial.needsUpdate = true;

						}

						if ( overrideMaterial.clipIntersection !== material.clipIntersection ) {

							overrideMaterial.clipIntersection = material.clipIntersection;

						}

					} else if ( Array.isArray( overrideMaterial.clippingPlanes ) ) {

						overrideMaterial.clippingPlanes = null;
						overrideMaterial.needsUpdate = true;

					}

				}

			}

			material = overrideMaterial;

		}

		//

		if ( material.transparent === true && material.side === DoubleSide && material.forceSinglePass === false ) {

			material.side = BackSide;
			this._handleObjectFunction( object, material, scene, camera, lightsNode, group, 'backSide' ); // create backSide pass id

			material.side = FrontSide;
			this._handleObjectFunction( object, material, scene, camera, lightsNode, group ); // use default pass id

			material.side = DoubleSide;

		} else {

			this._handleObjectFunction( object, material, scene, camera, lightsNode, group );

		}

		//

		if ( overridePositionNode !== undefined ) {

			scene.overrideMaterial.positionNode = overridePositionNode;

		}

		if ( overrideDepthNode !== undefined ) {

			scene.overrideMaterial.depthNode = overrideDepthNode;

		}

		if ( overrideFragmentNode !== undefined ) {

			scene.overrideMaterial.fragmentNode = overrideFragmentNode;

		}

		//

		object.onAfterRender( this, scene, camera, geometry, material, group );

	}

	_renderObjectDirect( object, material, scene, camera, lightsNode, group, passId ) {

		const renderObject = this._objects.get( object, material, scene, camera, lightsNode, this._currentRenderContext, passId );
		renderObject.drawRange = group || object.geometry.drawRange;

		//

		this._nodes.updateBefore( renderObject );

		//

		object.modelViewMatrix.multiplyMatrices( camera.matrixWorldInverse, object.matrixWorld );
		object.normalMatrix.getNormalMatrix( object.modelViewMatrix );

		//

		this._nodes.updateForRender( renderObject );
		this._geometries.updateForRender( renderObject );
		this._bindings.updateForRender( renderObject );
		this._pipelines.updateForRender( renderObject );

		//

		if ( this._currentRenderBundle !== null && this._currentRenderBundle.needsUpdate === true ) {

			const renderObjectData = this.backend.get( renderObject );

			renderObjectData.bundleEncoder = undefined;
			renderObjectData.lastPipelineGPU = undefined;

		}

		this.backend.draw( renderObject, this.info );

		if ( this._currentRenderBundle !== null ) {

			const renderContextData = this.backend.get( this._currentRenderContext );

			renderContextData.renderObjects.push( renderObject );

		}

		this._nodes.updateAfter( renderObject );

	}

	_createObjectPipeline( object, material, scene, camera, lightsNode, passId ) {

		const renderObject = this._objects.get( object, material, scene, camera, lightsNode, this._currentRenderContext, passId );

		//

		this._nodes.updateBefore( renderObject );

		//

		this._nodes.updateForRender( renderObject );
		this._geometries.updateForRender( renderObject );
		this._bindings.updateForRender( renderObject );

		this._pipelines.getForRender( renderObject, this._compilationPromises );

		this._nodes.updateAfter( renderObject );

	}

	get compute() {

		return this.computeAsync;

	}

	get compile() {

		return this.compileAsync;

	}

}

export default Renderer;
