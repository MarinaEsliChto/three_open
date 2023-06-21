import { normalGeometry } from '../../accessors/NormalNode.js';
import { fn } from '../../shadernode/ShaderNode.js';

const getGeometryRoughness = fn( () => {

	const dxy = normalGeometry.dFdx().abs().max( normalGeometry.dFdy().abs() );
	const geometryRoughness = dxy.x.max( dxy.y ).max( dxy.z );

	return geometryRoughness;

} );

export default getGeometryRoughness;
