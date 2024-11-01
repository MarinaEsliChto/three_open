import * as THREE from 'three';

function bufferToHash( buffer ) {

	let hash = 0;
	if ( buffer.byteLength !== 0 ) {

		let uintArray;
		if ( buffer.buffer ) {

			uintArray = new Uint8Array( buffer.buffer, buffer.byteOffset, buffer.byteLength );

		} else {

			uintArray = new Uint8Array( buffer );

		}

		for ( let i = 0; i < buffer.byteLength; i ++ ) {

			const byte = uintArray[ i ];
			hash = ( ( hash << 5 ) - hash ) + byte;
			hash |= 0;

		}

	}

	return hash;

}

/**
 * Gets material properties hash excluding color (since color can vary within a batch)
 * @param {THREE.Material} material - The material to hash
 * @returns {string} Hash of non-color material properties
 */
function getMaterialPropertiesHash( material ) {

	const mapProps = [
		'alphaMap',
		'aoMap',
		'bumpMap',
		'displacementMap',
		'emissiveMap',
		'envMap',
		'lightMap',
		'metalnessMap',
		'normalMap',
		'roughnessMap'
	];

	// Build map hash
	const mapHash = mapProps.map( prop => {

		const map = material[ prop ];
		if ( ! map ) return 0;
		return `${map.uuid}_${map.offset.x}_${map.offset.y}_${map.repeat.x}_${map.repeat.y}_${map.rotation}`;

	} ).join( '|' );

	// Build physical properties hash
	const physicalProps = [
		'transparent',
		'opacity',
		'alphaTest',
		'alphaToCoverage',
		'side',
		'vertexColors',
		'visible',
		'blending',
		'wireframe',
		'flatShading',
		'premultipliedAlpha',
		'dithering',
		'toneMapped',
		'depthTest',
		'depthWrite',
		// Physical material specific
		'metalness',
		'roughness',
		'clearcoat',
		'clearcoatRoughness',
		'sheen',
		'sheenRoughness',
		'transmission',
		'thickness',
		'attenuationDistance',
		'ior',
		'iridescence',
		'iridescenceIOR',
		'iridescenceThicknessRange',
		'reflectivity'
	].map( prop => {

		if ( typeof material[ prop ] === 'undefined' ) return 0;
		if ( material[ prop ] === null ) return 0;
		return material[ prop ].toString();

	} ).join( '|' );

	// Include emissive color (unlike base color, this can't vary per instance)
	const emissiveHash = material.emissive ?
		material.emissive.getHexString() :
		0;

	// Include attenuationColor
	const attenuationHash = material.attenuationColor ?
		material.attenuationColor.getHexString() :
		0;

	// Include sheenColor
	const sheenColorHash = material.sheenColor ?
		material.sheenColor.getHexString() :
		0;

	return [
		material.type,
		physicalProps,
		mapHash,
		emissiveHash,
		attenuationHash,
		sheenColorHash
	].join( '_' );

}

/**
 * Helper to get attributes signature for a geometry
 */
function getAttributesSignature( geometry ) {

	return Object.keys( geometry.attributes )
		.sort()
		.map( name => {

			const attribute = geometry.attributes[ name ];
			return `${name}_${attribute.itemSize}_${attribute.normalized}`;

		} )
		.join( '|' );

}

/**
 * Helper to get geometry hash including attributes signature
 */
function getGeometryHash( geometry ) {

	const indexHash = geometry.index ? bufferToHash( geometry.index.array ) : 'noIndex';
	const positionHash = bufferToHash( geometry.attributes.position.array );
	const attributesSignature = getAttributesSignature( geometry );
	return `${indexHash}_${positionHash}_${attributesSignature}`;

}

/**
 * Creates a combined key for batch grouping based on non-color material properties and attributes
 */
function getBatchKey( materialProps, attributesSignature ) {

	return `${materialProps}_${attributesSignature}`;

}

/**
 * Analyzes a GLTF model to group meshes by material properties (excluding color) and attributes
 */
function analyzeGLTFModel( gltfScene ) {

	const batchGroups = new Map();
	const singleGroups = new Map(); // Store single mesh groups separately

	gltfScene.updateMatrixWorld( true );
	gltfScene.traverse( node => {

		if ( ! node.isMesh ) return;

		const materialProps = getMaterialPropertiesHash( node.material );
		const attributesSignature = getAttributesSignature( node.geometry );
		const batchKey = getBatchKey( materialProps, attributesSignature );

		if ( ! batchGroups.has( batchKey ) ) {

			batchGroups.set( batchKey, {
				meshes: [],
				geometryStats: new Map()
			} );

		}

		const group = batchGroups.get( batchKey );
		group.meshes.push( node );

		// Track geometry statistics
		const geometryHash = getGeometryHash( node.geometry );
		if ( ! group.geometryStats.has( geometryHash ) ) {

			group.geometryStats.set( geometryHash, {
				count: 0,
				vertices: node.geometry.attributes.position.count,
				indices: node.geometry.index ? node.geometry.index.count : 0,
				geometry: node.geometry
			} );

		}

		group.geometryStats.get( geometryHash ).count ++;

	} );

	// Move single instance groups to singleGroups
	for ( const [ batchKey, group ] of batchGroups ) {

		const totalInstances = Array.from( group.geometryStats.values() )
			.reduce( ( sum, stats ) => sum + stats.count, 0 );

		if ( totalInstances === 1 ) {

			singleGroups.set( batchKey, group );
			batchGroups.delete( batchKey );

		}

	}

	return { batchGroups, singleGroups };

}


/**
 * Creates a BatchedMesh with exact buffer sizes
 */
function createPreciseBatchedMesh( materialProps, geometryStats ) {

	const maxGeometries = geometryStats.size + 1;
	const maxVertices = Array.from( geometryStats.values() )
		.reduce( ( sum, stats ) => sum + stats.vertices, 0 );
	const maxIndices = Array.from( geometryStats.values() )
		.reduce( ( sum, stats ) => sum + stats.indices, 0 );

	// Create material with shared properties
	const batchedMaterial = new THREE.MeshPhysicalMaterial( materialProps );

	return new THREE.BatchedMesh(
		maxGeometries,
		maxVertices,
		maxIndices,
		batchedMaterial
	);

}

/**
 * Converts a GLTF model into BatchedMeshes and individual meshes where appropriate
 * @param {THREE.Group} gltfScene - The loaded GLTF scene
 * @returns {{batched: THREE.BatchedMesh[], single: THREE.Mesh[]}} Converted meshes
 */
export function convertGLTFToBatchedMeshes( gltfScene ) {

	const { batchGroups, singleGroups } = analyzeGLTFModel( gltfScene );
	const batchedMeshes = [];
	const singleInstanceMeshes = [];

	const stats = {
		batchedMeshes: 0,
		meshes: 0,
		totalInstances: 0,
		uniqueGeometries: 0,
		uniqueMaterialVariants: new Set()
	};

	// Create batched meshes
	for ( const [ /* batchKey */, group ] of batchGroups ) {

		const batchedMesh = createPreciseBatchedMesh(
			group.materialProps,
			group.geometryStats
		);

		const geometryIds = new Map();

		// Add all meshes to the batch
		for ( const mesh of group.meshes ) {

			const geometryHash = getGeometryHash( mesh.geometry );

			if ( ! geometryIds.has( geometryHash ) ) {

				geometryIds.set(
					geometryHash,
					batchedMesh.addGeometry( mesh.geometry )
				);
				stats.uniqueGeometries ++;

			}

			const geometryId = geometryIds.get( geometryHash );
			const instanceId = batchedMesh.addInstance( geometryId );

			batchedMesh.setMatrixAt( instanceId, mesh.matrixWorld );
			// Set the color per instance
			batchedMesh.setColorAt( instanceId, mesh.material.color );

			stats.totalInstances ++;
			stats.uniqueMaterialVariants.add( getMaterialPropertiesHash( mesh.material ) );

		}

		batchedMeshes.push( batchedMesh );
		stats.batchedMeshes ++;

	}

	// Handle single instance meshes
	for ( const [ /* batchKey */, group ] of singleGroups ) {

		const mesh = group.meshes[ 0 ];
		// Clone the mesh to preserve the original
		const singleMesh = mesh.clone();
		singleInstanceMeshes.push( singleMesh );
		stats.meshes ++;
		stats.totalInstances ++;

	}

	// console.log( 'Conversion stats:', {
	// 	...stats,
	// 	uniqueMaterialVariants: stats.uniqueMaterialVariants.size,
	// 	totalMeshes: stats.batchedMeshes + stats.meshes
	// } );

	return [ ...batchedMeshes, ...singleInstanceMeshes ];

}

// Example usage:
/*
const batchedMeshes = convertGLTFToBatchedMeshes(gltf.scene);
batchedMeshes.forEach(mesh => scene.add(mesh));
*/
