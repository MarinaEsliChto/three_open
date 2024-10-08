import BufferNode from './BufferNode.js';
import { bufferAttribute } from './BufferAttributeNode.js';
import { nodeObject, varying } from '../tsl/TSLBase.js';
import { storageElement } from '../utils/StorageArrayElementNode.js';
import { GPUBufferBindingType } from '../../renderers/webgpu/utils/WebGPUConstants.js';

class StorageBufferNode extends BufferNode {

	static get type() {

		return 'StorageBufferNode';

	}

	constructor( value, bufferType, bufferCount = 0 ) {

		super( value, bufferType, bufferCount );

		this.isStorageBufferNode = true;

		this.access = GPUBufferBindingType.Storage;
		this.isAtomic = false;

		this.bufferObject = false;
		this.bufferCount = bufferCount;

		this._attribute = null;
		this._varying = null;

		this.global = true;

		if ( value.isStorageBufferAttribute !== true && value.isStorageInstancedBufferAttribute !== true && value.isIndirectStorageBufferAttribute !== true ) {

			// TOOD: Improve it, possibly adding a new property to the BufferAttribute to identify it as a storage buffer read-only attribute in Renderer

			if ( value.isBufferAttribute ) {

				value.isStorageBufferAttribute = true;

			} else if ( value.isInstancedBufferAttribute ) {

				value.isStorageInstancedBufferAttribute = true;

			} else if ( value.isIndirectBufferAttribute ) {	//todo

				value.isIndirectStorageBufferAttribute = true;

			}

		}

	}

	getHash( builder ) {

		if ( this.bufferCount === 0 ) {

			let bufferData = builder.globalCache.getData( this.value );

			if ( bufferData === undefined ) {

				bufferData = {
					node: this
				};

				builder.globalCache.setData( this.value, bufferData );

			}

			return bufferData.node.uuid;

		}

		return this.uuid;

	}

	getInputType( /*builder*/ ) {

		if ( this.value.isIndirectStorageBufferAttribute ) {

			return 'indirectStorageBuffer';

		} else {

			return 'storageBuffer';

		}

	}

	element( indexNode ) {

		return storageElement( this, indexNode );

	}

	setBufferObject( value ) {

		this.bufferObject = value;

		return this;

	}

	setAccess( value ) {

		this.access = value;

		return this;

	}

	toReadOnly() {

		return this.setAccess( GPUBufferBindingType.ReadOnlyStorage );

	}

	setAtomic( value ) {

		this.isAtomic = value;

		return this;

	}

	toAtomic() {

		return this.setAtomic( true );

	}

	getAttributeData() {

		if ( this._attribute === null ) {

			this._attribute = bufferAttribute( this.value );
			this._varying = varying( this._attribute );

		}

		return {
			attribute: this._attribute,
			varying: this._varying
		};

	}

	getNodeType( builder ) {

		if ( builder.isAvailable( 'storageBuffer' ) || builder.isAvailable( 'indirectStorageBuffer' ) ) {

			return super.getNodeType( builder );

		}

		const { attribute } = this.getAttributeData();

		return attribute.getNodeType( builder );

	}

	generate( builder ) {

		if ( builder.isAvailable( 'storageBuffer' ) || builder.isAvailable( 'indirectStorageBuffer' ) ) {

			return super.generate( builder );

		}

		const nodeType = this.getNodeType( builder );

		if ( this._attribute === null ) {

			this._attribute = bufferAttribute( this.value );
			this._varying = varying( this._attribute );

		}

		const output = this._varying.build( builder, nodeType );

		builder.registerTransform( output, this._attribute );

		return output;

	}

}

export default StorageBufferNode;

// Read-Write Storage
export const storage = ( value, type, count ) => nodeObject( new StorageBufferNode( value, type, count ) );
export const storageObject = ( value, type, count ) => nodeObject( new StorageBufferNode( value, type, count ).setBufferObject( true ) );
