import {
	Mesh,
	NodeMaterial,
	SphereGeometry
} from 'three';
import { float, Fn, getShIrradianceAt, normalWorld, uniformArray, uniform, vec4 } from 'three/tsl';

class LightProbeHelper extends Mesh {

	constructor( lightProbe, size = 1 ) {

		const sh = uniformArray( lightProbe.sh.coefficients );
		const intensity = uniform( lightProbe.intensity );

		const RECIPROCAL_PI = float( 1 / Math.PI );

		const fragmentNode = Fn( () => {

			const irradiance = getShIrradianceAt( normalWorld, sh );

			const outgoingLight = RECIPROCAL_PI.mul( irradiance ).mul( intensity );

			return vec4( outgoingLight, 1.0 );

		} )();

		const material = new NodeMaterial();
		material.fragmentNode = fragmentNode;

		const geometry = new SphereGeometry( 1, 32, 16 );

		super( geometry, material );

		this.lightProbe = lightProbe;
		this.size = size;
		this.type = 'LightProbeHelper';

		this.onBeforeRender();

	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

	onBeforeRender() {

		this.position.copy( this.lightProbe.position );

		this.scale.set( 1, 1, 1 ).multiplyScalar( this.size );

	}

}

export { LightProbeHelper };
