import { IntType } from 'three';

let _id = 0;

class DualAttributeData {

	constructor( attributeData, dualBuffer ) {

		this.buffers = [ attributeData.bufferGPU, dualBuffer ];
		this.type = attributeData.type;
		this.pbo = attributeData.pbo;
		this.bytesPerElement = attributeData.BYTES_PER_ELEMENT;
		this.version = attributeData.version;
		this.isInteger = attributeData.isInteger;
		this.activeBufferIndex = 0;
		this.baseId = attributeData.id;

	}


	get id() {

		return `${ this.baseId }|${ this.activeBufferIndex }`;

	}

	get bufferGPU() {

		return this.buffers[ this.activeBufferIndex ];

	}

	get transformBuffer() {

		return this.buffers[ this.activeBufferIndex ^ 1 ];

	}

	switchBuffers() {

		this.activeBufferIndex ^= 1;

	}

}

class WebGLAttributeUtils {

	constructor( backend ) {

		this.backend = backend;

	}

	createAttribute( attribute, bufferType ) {

		const backend = this.backend;
		const { gl } = backend;

		const array = attribute.array;
		const usage = attribute.usage || gl.STATIC_DRAW;

		const bufferAttribute = attribute.isInterleavedBufferAttribute ? attribute.data : attribute;
		const bufferData = backend.get( bufferAttribute );

		let bufferGPU = bufferData.bufferGPU;

		if ( bufferGPU === undefined ) {

			bufferGPU = this._createBuffer( gl, bufferType, array, usage );

			bufferData.bufferGPU = bufferGPU;
			bufferData.bufferType = bufferType;
			bufferData.version = bufferAttribute.version;

		}

		//attribute.onUploadCallback();

		let type;

		if ( array instanceof Float32Array ) {

			type = gl.FLOAT;

		} else if ( array instanceof Uint16Array ) {

			if ( attribute.isFloat16BufferAttribute ) {

				type = gl.HALF_FLOAT;

			} else {

				type = gl.UNSIGNED_SHORT;

			}

		} else if ( array instanceof Int16Array ) {

			type = gl.SHORT;

		} else if ( array instanceof Uint32Array ) {

			type = gl.UNSIGNED_INT;

		} else if ( array instanceof Int32Array ) {

			type = gl.INT;

		} else if ( array instanceof Int8Array ) {

			type = gl.BYTE;

		} else if ( array instanceof Uint8Array ) {

			type = gl.UNSIGNED_BYTE;

		} else if ( array instanceof Uint8ClampedArray ) {

			type = gl.UNSIGNED_BYTE;

		} else {

			throw new Error( 'THREE.WebGLBackend: Unsupported buffer data format: ' + array );

		}

		let attributeData = {
			bufferGPU,
			type,
			bytesPerElement: array.BYTES_PER_ELEMENT,
			version: attribute.version,
			pbo: attribute.pbo,
			isInteger: type === gl.INT || type === gl.UNSIGNED_INT || attribute.gpuType === IntType,
			id: _id ++
		};

		if ( attribute.isStorageBufferAttribute ) {

			// create buffer for tranform feedback use
			const bufferGPUDual = this._createBuffer( gl, bufferType, array, usage );
			attributeData = new DualAttributeData( attributeData, bufferGPUDual );

		}

		backend.set( attribute, attributeData );

	}

	updateAttribute( attribute ) {

		const backend = this.backend;
		const { gl } = backend;

		const array = attribute.array;
		const bufferAttribute = attribute.isInterleavedBufferAttribute ? attribute.data : attribute;
		const bufferData = backend.get( bufferAttribute );
		const bufferType = bufferData.bufferType;
		const updateRanges = attribute.isInterleavedBufferAttribute ? attribute.data.updateRanges : attribute.updateRanges;

		gl.bindBuffer( bufferType, bufferData.bufferGPU );

		if ( updateRanges.length === 0 ) {

			// Not using update ranges

			gl.bufferSubData( bufferType, 0, array );

		} else {

			for ( let i = 0, l = updateRanges.length; i < l; i ++ ) {

				const range = updateRanges[ i ];
				gl.bufferSubData( bufferType, range.start * array.BYTES_PER_ELEMENT,
					array, range.start, range.count );

			}

			bufferAttribute.clearUpdateRanges();

		}

		gl.bindBuffer( bufferType, null );

		bufferData.version = bufferAttribute.version;

	}

	destroyAttribute( attribute ) {

		const backend = this.backend;
		const { gl } = backend;

		if ( attribute.isInterleavedBufferAttribute ) {

			backend.delete( attribute.data );

		}

		const attributeData = backend.get( attribute );

		gl.deleteBuffer( attributeData.bufferGPU );

		backend.delete( attribute );

	}

	async getArrayBufferAsync( attribute ) {

		const backend = this.backend;
		const { gl } = backend;

		const bufferAttribute = attribute.isInterleavedBufferAttribute ? attribute.data : attribute;
		const { bufferGPU } = backend.get( bufferAttribute );

		const array = attribute.array;
		const byteLength = array.byteLength;

		gl.bindBuffer( gl.COPY_READ_BUFFER, bufferGPU );

		const writeBuffer = gl.createBuffer();

		gl.bindBuffer( gl.COPY_WRITE_BUFFER, writeBuffer );
		gl.bufferData( gl.COPY_WRITE_BUFFER, byteLength, gl.STREAM_READ );

		gl.copyBufferSubData( gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, 0, 0, byteLength );

		await backend.utils._clientWaitAsync();

		const dstBuffer = new attribute.array.constructor( array.length );

		gl.getBufferSubData( gl.COPY_WRITE_BUFFER, 0, dstBuffer );

		gl.deleteBuffer( writeBuffer );

		return dstBuffer.buffer;

	}

	_createBuffer( gl, bufferType, array, usage ) {

		const bufferGPU = gl.createBuffer();

		gl.bindBuffer( bufferType, bufferGPU );
		gl.bufferData( bufferType, array, usage );
		gl.bindBuffer( bufferType, null );

		return bufferGPU;

	}

}

export default WebGLAttributeUtils;
