import {BackSide, Mesh, MeshBasicMaterial, SphereGeometry, Vector3} from 'three';

export class GroundedSkybox extends Mesh {
  constructor(map,height, radius, resolution = 128) {
if(height<=0||radius<=0||resolution<=0){
	throw new Error( 'GroundedSkybox height, radius, and resolution must be positive.' );
}

		const geometry = new SphereGeometry(radius, 2 * resolution, resolution);

		const pos = geometry.getAttribute('position');
		const tmp = new Vector3();
		for (let i = 0; i < pos.count; ++i) {
			tmp.fromBufferAttribute(pos, i);
			if (tmp.y < 0) {
				// Smooth out the transition from flat floor to sphere:
				const y1 = -height * 3 / 2;
				const f =
						tmp.y < y1 ? -height / tmp.y : (1 - tmp.y * tmp.y / (3 * y1 * y1));
				tmp.multiplyScalar(f);
				tmp.toArray(pos.array, 3 * i);
			}
		}
		pos.needsUpdate = true;

    super(geometry, new MeshBasicMaterial({map,side: BackSide}));
  }
}

export { GroundedSkybox };
