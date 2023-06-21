import F_Schlick from './F_Schlick.js';
import V_GGX_SmithCorrelated from './V_GGX_SmithCorrelated.js';
import D_GGX from './D_GGX.js';
import { transformedNormalView } from '../../accessors/NormalNode.js';
import { positionViewDirection } from '../../accessors/PositionNode.js';
import { fn } from '../../shadernode/ShaderNode.js';

// GGX Distribution, Schlick Fresnel, GGX_SmithCorrelated Visibility
const BRDF_GGX = fn( ( inputs ) => {

	const { lightDirection, f0, f90, roughness } = inputs;

	const normalView = inputs.normalView || transformedNormalView;

	const alpha = roughness.pow2(); // UE4's roughness

	const halfDir = lightDirection.add( positionViewDirection ).normalize();

	const dotNL = normalView.dot( lightDirection ).clamp();
	const dotNV = normalView.dot( positionViewDirection ).clamp(); // @ TODO: Move to core dotNV
	const dotNH = normalView.dot( halfDir ).clamp();
	const dotVH = positionViewDirection.dot( halfDir ).clamp();

	const F = F_Schlick( { f0, f90, dotVH } );
	const V = V_GGX_SmithCorrelated( { alpha, dotNL, dotNV } );
	const D = D_GGX( { alpha, dotNH } );

	return F.mul( V ).mul( D );

} ); // validated

export default BRDF_GGX;
