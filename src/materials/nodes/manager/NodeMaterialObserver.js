const refreshUniforms = [
	'alphaMap',
	'alphaTest',
	'anisotropy',
	'anisotropyMap',
	'anisotropyRotation',
	'aoMap',
	'attenuationColor',
	'attenuationDistance',
	'bumpMap',
	'clearcoat',
	'clearcoatMap',
	'clearcoatNormalMap',
	'clearcoatNormalScale',
	'clearcoatRoughness',
	'color',
	'dispersion',
	'displacementMap',
	'emissive',
	'emissiveMap',
	'envMap',
	'gradientMap',
	'ior',
	'iridescence',
	'iridescenceIOR',
	'iridescenceMap',
	'iridescenceThicknessMap',
	'lightMap',
	'map',
	'matcap',
	'metalness',
	'metalnessMap',
	'normalMap',
	'normalScale',
	'opacity',
	'roughness',
	'roughnessMap',
	'sheen',
	'sheenColor',
	'sheenColorMap',
	'sheenRoughnessMap',
	'shininess',
	'specular',
	'specularColor',
	'specularColorMap',
	'specularIntensity',
	'specularIntensityMap',
	'specularMap',
	'thickness',
	'transmission',
	'transmissionMap'
];

class NodeMaterialObserver {

	constructor( builder ) {

		this.renderObjects = new WeakMap();
		this.hasNode = this.containsNode( builder );
		this.hasAnimation = builder.object.isSkinnedMesh === true;
		this.refreshUniforms = refreshUniforms;
		this.renderId = 0;

	}

	firstInitialization( renderObject ) {

		const hasInitialized = this.renderObjects.has( renderObject );

		if ( hasInitialized === false ) {

			this.getRenderObjectData( renderObject );

			return true;

		}

		return false;

	}

	getRenderObjectData( renderObject ) {

		let data = this.renderObjects.get( renderObject );

		if ( data === undefined ) {

			data = {
				material: this.getMaterialData( renderObject.material ),
				geometry: this.getGeometryData( renderObject.geometry ),
				worldMatrix: renderObject.object.matrixWorld.clone()
			};

			if ( renderObject.object.center ) {

				data.center = renderObject.object.center.clone();

			}

			if ( renderObject.object.morphTargetInfluences ) {

				data.morphTargetInfluences = renderObject.object.morphTargetInfluences.slice();

			}

			if ( renderObject.bundle !== null ) {

				data.version = renderObject.bundle.version;

			}

			this.renderObjects.set( renderObject, data );

		}

		return data;

	}

	containsNode( builder ) {

		const material = builder.material;

		for ( const property in material ) {

			if ( material[ property ] && material[ property ].isNode )
				return true;

		}

		if ( builder.renderer.nodes.modelViewMatrix !== null || builder.renderer.nodes.modelNormalViewMatrix !== null )
			return true;

		return false;

	}

	getMaterialData( material ) {

		const data = {};

		for ( const property of this.refreshUniforms ) {

			const value = material[ property ];

			if ( value === null || value === undefined ) continue;

			if ( typeof value === 'object' && value.clone !== undefined ) {

				if ( value.isTexture === true ) {

					data[ property ] = { id: value.id, version: value.version };

				} else {

					data[ property ] = value.clone();

				}

			} else {

				data[ property ] = value;

			}

		}

		return data;

	}

	getGeometryData( geometry ) {

		const data = {
			attributes: {}
		};

		const attributes = geometry.attributes;

		for ( const name in attributes ) {

			const attribute = attributes[ name ];

			data.attributes[ name ] = {
				version: attribute.version
			};

		}

		if ( geometry.index !== null ) {

			const index = geometry.index;

			data.index = {
				version: index.version
			};

		}

		data.drawRange = {
			start: geometry.drawRange.start,
			count: geometry.drawRange.count
		};

		data.morphAttributes = {};

		for ( const name in geometry.morphAttributes ) {

			const morphArray = geometry.morphAttributes[ name ];
			data.morphAttributes[ name ] = [];

			for ( let i = 0; i < morphArray.length; i ++ ) {

				const attribute = morphArray[ i ];

				data.morphAttributes[ name ][ i ] = {
					version: attribute.version
				};

			}

		}

		return data;

	}

	compareGeometryData( storedData, currentData ) {

		// Compare attributes
		const storedAttributes = storedData.attributes;
		const currentAttributes = currentData.attributes;

		const storedAttributeNames = Object.keys( storedAttributes );
		const currentAttributeNames = Object.keys( currentAttributes );

		if ( storedAttributeNames.length !== currentAttributeNames.length ) {

			return false;

		}

		for ( const name of storedAttributeNames ) {

			if ( currentAttributes[ name ] === undefined ) {

				return false;

			}

			const storedAttribute = storedAttributes[ name ];
			const currentAttribute = currentAttributes[ name ];

			if ( storedAttribute.version !== currentAttribute.version ) {

				return false;

			}

		}

		// Compare index
		if ( ( storedData.index === undefined ) !== ( currentData.index === undefined ) ) {

			return false;

		}

		if ( storedData.index && currentData.index ) {

			if ( storedData.index.version !== currentData.index.version ) {

				return false;

			}

		}

		// Compare drawRange
		if ( storedData.drawRange.start !== currentData.drawRange.start ||
			storedData.drawRange.count !== currentData.drawRange.count ) {

			return false;

		}

		// Compare morphAttributes
		const storedMorphAttributes = storedData.morphAttributes;
		const currentMorphAttributes = currentData.morphAttributes;

		const storedMorphNames = Object.keys( storedMorphAttributes );
		const currentMorphNames = Object.keys( currentMorphAttributes );

		if ( storedMorphNames.length !== currentMorphNames.length ) {

			return false;

		}

		for ( const name of storedMorphNames ) {

			if ( currentMorphAttributes[ name ] === undefined ) {

				return false;

			}

			const storedMorphArray = storedMorphAttributes[ name ];
			const currentMorphArray = currentMorphAttributes[ name ];

			if ( storedMorphArray.length !== currentMorphArray.length ) {

				return false;

			}

			for ( let i = 0; i < storedMorphArray.length; i ++ ) {

				const storedAttribute = storedMorphArray[ i ];
				const currentAttribute = currentMorphArray[ i ];

				if ( storedAttribute.version !== currentAttribute.version ) {

					return false;

				}

			}

		}

		return true;

	}

	equals( renderObject ) {

		const { object, material } = renderObject;

		const renderObjectData = this.getRenderObjectData( renderObject );

		// world matrix

		if ( renderObjectData.worldMatrix.equals( object.matrixWorld ) !== true ) {

			renderObjectData.worldMatrix.copy( object.matrixWorld );

			return false;

		}

		// material

		const materialData = renderObjectData.material;

		for ( const property in materialData ) {

			const value = materialData[ property ];
			const mtlValue = material[ property ];

			if ( value.equals !== undefined ) {

				if ( value.equals( mtlValue ) === false ) {

					value.copy( mtlValue );

					return false;

				}

			} else if ( mtlValue.isTexture === true ) {

				if ( value.id !== mtlValue.id || value.version !== mtlValue.version ) {

					value.id = mtlValue.id;
					value.version = mtlValue.version;

					return false;

				}

			} else if ( value !== mtlValue ) {

				materialData[ property ] = mtlValue;

				return false;

			}

		}

		    // geometry

		const geometryData = renderObjectData.geometry;
		const currentGeometryData = this.getGeometryData( renderObject.geometry );

		if ( ! this.compareGeometryData( geometryData, currentGeometryData ) ) {

			// Update stored geometry data
			renderObjectData.geometry = currentGeometryData;

			return false;

		}


		// morph targets

		if ( renderObjectData.morphTargetInfluences ) {

			let morphChanged = false;

			for ( let i = 0; i < renderObjectData.morphTargetInfluences.length; i ++ ) {

				if ( renderObjectData.morphTargetInfluences[ i ] !== object.morphTargetInfluences[ i ] ) {

					morphChanged = true;

				}

			}

			if ( morphChanged ) return true;

		}

		// center

		if ( renderObjectData.center ) {

			if ( renderObjectData.center.equals( object.center ) === false ) {

				renderObjectData.center.copy( object.center );

				return true;

			}

		}

		// bundle

		if ( renderObject.bundle !== null ) {

			renderObjectData.version = renderObject.bundle.version;

		}

		return true;

	}

	needsRefresh( renderObject, nodeFrame ) {

		if ( this.hasNode || this.hasAnimation || this.firstInitialization( renderObject ) )
			return true;

		const { renderId } = nodeFrame;

		if ( this.renderId !== renderId ) {

			this.renderId = renderId;

			return true;

		}

		const isStatic = renderObject.object.static === true;
		const isBundle = renderObject.bundle !== null && renderObject.bundle.static === true && this.getRenderObjectData( renderObject ).version === renderObject.bundle.version;

		if ( isStatic || isBundle )
			return false;

		const notEqual = this.equals( renderObject ) !== true;

		return notEqual;

	}

}

export default NodeMaterialObserver;
