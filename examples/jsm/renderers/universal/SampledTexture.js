import Binding from './Binding.js';

let id = 0;

class SampledTexture extends Binding {

	constructor( name, texture ) {

		super( name );

		this.id = id ++;

		this.texture = texture;
		this.version = 0;

		this.isSampledTexture = true;

	}

	get needsBindingsUpdate() {

		const { texture, version } = this;

		return texture.isVideoTexture ? true : version === 0 && texture.version > 0;

	}

	update() {

		if ( this.version !== this.texture.version ) {

			this.version = this.texture.version;

			return true;

		}

		return false;

	}

}

class SampledArrayTexture extends SampledTexture {

	constructor( name, texture ) {

		super( name, texture );

		this.isSampledArrayTexture = true;

	}

}

class Sampled3DTexture extends SampledTexture {

	constructor( name, texture ) {

		super( name, texture );

		this.isSampled3DTexture = true;

	}

}

class SampledCubeTexture extends SampledTexture {

	constructor( name, texture ) {

		super( name, texture );

		this.isSampledCubeTexture = true;

	}

}

export { SampledTexture, SampledArrayTexture, Sampled3DTexture, SampledCubeTexture };
