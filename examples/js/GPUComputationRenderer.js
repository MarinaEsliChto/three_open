/**
 * @author yomboprime https://github.com/yomboprime
 *
 * GPUComputationRenderer, based on SimulationRenderer by zz85
 *
 * The GPUComputationRenderer uses the concept of variables. These variables are RGBA float textures that hold 4 floats
 * for each compute element (texel)
 *
 * Each variable has a fragment shader that defines the computation made to obtain the variable in question.
 * You can use as many variables you need, and make dependencies so you can use textures of other variables in the shader
 * (the sampler uniforms are added automatically) Most of the variables will need themselves as dependency.
 *
 * The renderer has actually two render targets per variable, to make ping-pong. Textures from the current frame are used
 * as inputs to render the textures of the next frame.
 *
 * The render targets of the variables can be used as input textures for your visualization shaders.
 *
 * Variable names should be valid identifiers and should not collide with THREE GLSL used identifiers.
 * a common approach could be to use 'texture' prefixing the variable name; i.e texturePosition, textureVelocity...
 *
 * The size of the computation (sizeX * sizeY) is defined as 'resolution' automatically in the shader. For example:
 * #DEFINE resolution vec2( 1024.0, 1024.0 )
 *
 * -------------
 *
 * Basic use:
 *
 * // Initialization...
 *
 * // Create computation renderer
 * var gpuCompute = new GPUComputationRenderer( 1024, 1024, renderer );
 *
 * // Create initial state float textures
 * var pos0 = gpuCompute.createTexture();
 * var vel0 = gpuCompute.createTexture();
 * // and fill in here the texture data...
 *
 * // Add texture variables
 * var velVar = gpuCompute.addVariable( "textureVelocity", fragmentShaderVel, pos0 );
 * var posVar = gpuCompute.addVariable( "texturePosition", fragmentShaderPos, vel0 );
 *
 * // Add variable dependencies
 * gpuCompute.setVariableDependencies( velVar, [ velVar, posVar ] );
 * gpuCompute.setVariableDependencies( posVar, [ velVar, posVar ] );
 *
 * // Add custom uniforms
 * velVar.material.uniforms.time = { value: 0.0 };
 *
 * // Check for completeness
 * var error = gpuCompute.init();
 * if ( error !== null ) {
 *		console.error( error );
  * }
 *
 *
 * // In each frame...
 *
 * // Compute!
 * gpuCompute.compute();
 *
 * // Update texture uniforms in your visualization materials with the gpu renderer output
 * myMaterial.uniforms.myTexture.value = gpuCompute.getCurrentRenderTarget( posVar ).texture;
 *
 * // Do your rendering
 * renderer.render( myScene, myCamera );
 *
 * -------------
 *
 * Also, you can use utility functions to create ShaderMaterial and perform computations (rendering between textures)
 * Note that the shaders can have multiple input textures.
 *
 * var myFilter1 = gpuCompute.createShaderMaterial( myFilterFragmentShader1, { theTexture: { value: null } } );
 * var myFilter2 = gpuCompute.createShaderMaterial( myFilterFragmentShader2, { theTexture: { value: null } } );
 *
 * var inputTexture = gpuCompute.createTexture();
 *
 * // Fill in here inputTexture...
 *
 * myFilter1.uniforms.theTexture.value = inputTexture;
 *
 * var myRenderTarget = gpuCompute.createRenderTarget();
 * myFilter2.uniforms.theTexture.value = myRenderTarget.texture;
 *
 * var outputRenderTarget = gpuCompute.createRenderTarget();
 *
 * // Now use the output texture where you want:
 * myMaterial.uniforms.map.value = outputRenderTarget.texture;
 *
 * // And compute each frame, before rendering to screen:
 * gpuCompute.doRenderTarget( myFilter1, myRenderTarget );
 * gpuCompute.doRenderTarget( myFilter2, outputRenderTarget );
 * 
 *
 * @author Sam Stewart http://github.com/samstewart samstewart
 * Added a few improvements:
 * 1. Render variables individually instead of all at once.
 * 2. Different resolution textures for different variables (problem with textures of mixed resolution?)
 *
 * @param {int} sizeX Computation problem size is always 2d: sizeX * sizeY elements.
 * @param {int} sizeY Computation problem size is always 2d: sizeX * sizeY elements.
 * @param {WebGLRenderer} renderer The renderer
  */

function GPUComputationRenderer( sizeX, sizeY, renderer ) {

	this.renderer = renderer;

	this.variables = [];

	// setup the scene for rendering
	var scene = new THREE.Scene();

	var camera = new THREE.Camera();
	camera.position.z = 1;

	// setup the initial shader for the mesh
	var passThruUniforms = {
		texture: { value: null }
	};

	var passThruShader = createShaderMaterial( getPassThroughFragmentShader(sizeX, sizeY), passThruUniforms );

	var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), passThruShader );
	scene.add( mesh );

	this.magFilter = THREE.NearestFilter;
	this.minFilter = THREE.NearestFilter;

	if ( renderer.extensions.get('OES_texture_float_linear') ) {
		// use bilinear interpolation if it is available
		this.magFilter = THREE.LinearFilter;
	}

	this.addVariable = function( variableName, computeFragmentShader, initialValueTexture ) {

		var material = this.createShaderMaterial( computeFragmentShader, {}, initialValueTexture.image.width, initialValueTexture.image.height );

		var passThruUniforms = {
			texture: { value: null }
		}; 

		var variable = {
			name: variableName,
			initialValueTexture: initialValueTexture,
			material: material,
			dependencies: null,
			renderTargets: [],
			wrapS: null,
			wrapT: null,
			minFilter: this.minFilter,
			magFilter: this.magFilter,
			currentTextureIndex: 0,
			sizeX: initialValueTexture.image.width,
			sizeY: initialValueTexture.image.height
		};

		variable.passThruShader = createShaderMaterial( 
			getPassThroughFragmentShader( variable.sizeX, variable.sizeY ), 
			passThruUniforms );
	
		this.variables.push( variable );

		return variable;
		
	};



	this.setVariableDependencies = function( variable, dependencies ) {

		variable.dependencies = dependencies;

	};

	this.init = function() {

		

		if ( ! renderer.extensions.get( "OES_texture_float" ) ) {

			return "No OES_texture_float support for float textures.";

		}

		if ( renderer.capabilities.maxVertexTextures === 0 ) {

			return "No support for vertex shader textures.";

		}

		for ( var i = 0; i < this.variables.length; i++ ) {

			var variable = this.variables[ i ];

			// make sure we are rendering the proper buffer
			variable.currentTextureIndex = 0;

			// Creates rendertargets and initializes the two buffers with input texture

			for (var k = 0; k < 2; k++) {
				variable.renderTargets[ k ] = this.createRenderTarget( variable.sizeX, variable.sizeY, variable.wrapS, variable.wrapT, variable.minFilter, variable.magFilter );
				this.renderTexture( variable.initialValueTexture, variable.renderTargets[ k ], variable.passThruShader );
			}
			

			// Adds dependencies uniforms to the ShaderMaterial
			var material = variable.material;
			var uniforms = material.uniforms;



			if ( variable.dependencies !== null ) {

				for ( var d = 0; d < variable.dependencies.length; d++ ) {

					var depVar = variable.dependencies[ d ];

					if ( depVar.name !== variable.name ) {

						// Checks if variable exists
						var found = false;
						for ( var j = 0; j < this.variables.length; j++ ) {

							if ( depVar.name === this.variables[ j ].name ) {
								found = true;
								break;
							}

						}
						if ( ! found ) {
							return "Variable dependency not found. Variable=" + variable.name + ", dependency=" + depVar.name;
						}

					}

					uniforms[ depVar.name ] = { value: null };

					// add the default variables
					material.fragmentShader = "\nuniform sampler2D " + depVar.name + ";\n" + material.fragmentShader;

				}
			}
		}

		return null;

	};

	this.computeVariable = function( variable ) {
		// flip between the two buffers for the variable
		var currentTextureIndex = variable.currentTextureIndex;
		var nextTextureIndex = variable.currentTextureIndex === 0 ? 1 : 0;

		// Sets texture dependencies uniforms
		// TODO: force recompute all dependencies?
		if ( variable.dependencies !== null ) {

			var uniforms = variable.material.uniforms;

			for ( var d = 0, dl = variable.dependencies.length; d < dl; d++ ) {

				var depVar = variable.dependencies[ d ];

				uniforms[ depVar.name ].value = depVar.renderTargets[ currentTextureIndex ].texture;
			}

		}

		// Performs the computation for this variable
		this.doRenderTarget( variable.material, variable.renderTargets[ nextTextureIndex ] );

		variable.currentTextureIndex = nextTextureIndex;
	}

	this.compute = function() {

		for ( var i = 0, il = this.variables.length; i < il; i++ ) {
			this.computeVariable(this.variables[ i ]);
		}

	};

	this.getCurrentRenderTarget = function( variable ) {

		return variable.renderTargets[ variable.currentTextureIndex ];

	};

	this.getAlternateRenderTarget = function( variable ) {

		return variable.renderTargets[ variable.currentTextureIndex === 0 ? 1 : 0 ];

	};

	function getResolutionDefineString(w, h) {
		return "\n#define resolution vec2(" + w.toFixed(1) + ", " + h.toFixed(1) + ")\n";
	}

	this.getResolutionDefineString = getResolutionDefineString;

	// The following functions can be used to compute things manually

	function createShaderMaterial( computeFragmentShader, uniforms, sizeVariableX, sizeVariableY) {

		uniforms = uniforms || {};

		// set the proper resolution for the fragment shader
		sizeVariableX = sizeVariableX || sizeX;
		sizeVariableY = sizeVariableY || sizeY;

		// add the resolution parameter
		computeFragmentShader = getResolutionDefineString(sizeVariableX, sizeVariableY) + computeFragmentShader;

		var material = new THREE.ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: getPassThroughVertexShader(),
			fragmentShader: computeFragmentShader
		} );

		return material;
	}

	this.createShaderMaterial = createShaderMaterial;

	this.createRenderTarget = function( sizeXTexture, sizeYTexture, wrapS, wrapT, minFilter, magFilter ) {

		sizeXTexture = sizeXTexture || sizeX;
		sizeYTexture = sizeYTexture || sizeY;

		wrapS = wrapS || THREE.ClampToEdgeWrapping;
		wrapT = wrapT || THREE.ClampToEdgeWrapping;

		minFilter = minFilter || this.magFilter;
		magFilter = magFilter || this.magFilter;

		var renderTarget = new THREE.WebGLRenderTarget( sizeXTexture, sizeYTexture, {
			wrapS: wrapS,
			wrapT: wrapT,
			minFilter: minFilter,
			magFilter: magFilter,
			format: THREE.RGBAFormat,
			type: ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? THREE.HalfFloatType : THREE.FloatType,
			stencilBuffer: false
		} );

		return renderTarget;

	};

	this.createTexture = function( sizeXTexture, sizeYTexture ) {
		sizeXTexture = sizeXTexture || sizeX;
		sizeYTexture = sizeYTexture || sizeY;

		var a 		= new Float32Array( sizeXTexture * sizeYTexture * 4 );
		var texture = new THREE.DataTexture( 
			a, 
			sizeXTexture, 
			sizeYTexture, 
			THREE.RGBAFormat, 
			THREE.FloatType,
			THREE.UVMapping,
			THREE.ClampToEdgeWrapping,
			THREE.ClampToEdgeWrapping,
			this.magFilter,
			this.minFilter
			);

		texture.needsUpdate = true;
		

		return texture;
	};
    
	this.renderTexture = function( input, output, passThruShader) {

		// Takes a texture, and render out in rendertarget
		// input = Texture
		// output = RenderTarget
		// passThruShader is what we se to render the texture
		mesh.material = passThruShader;

		passThruShader.uniforms.texture.value = input;

		this.doRenderTarget( passThruShader, output);

		passThruShader.uniforms.texture.value = null;
	};

	this.doRenderTarget = function( material, output ) {
		mesh.material = material;
		this.renderer.render( scene, camera, output );
	};

	// Shaders

	function getPassThroughVertexShader() {
		return	"void main()	{\n" +
				"\n" +
				"	gl_Position = vec4( position, 1.0 );\n" +
				"\n" +
				"}\n";

	}

	function getPassThroughFragmentShader(w,h) {

		return	getResolutionDefineString(w, h) +
				"\nuniform sampler2D texture;\n\n" +
				"void main() {\n" +
				"\n" +
				"	vec2 uv = gl_FragCoord.xy / resolution.xy;\n" +
				"\n" +
				"	gl_FragColor = texture2D(texture, uv);\n" +
				"\n" +
				"}\n";

	}

}


