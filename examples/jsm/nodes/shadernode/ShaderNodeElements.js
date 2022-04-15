// core
//import ArrayUniformNode from '../core/ArrayUniformNode.js';
import AttributeNode from '../core/AttributeNode.js';
import BypassNode from '../core/BypassNode.js';
import CodeNode from '../core/CodeNode.js';
import ContextNode from '../core/ContextNode.js';
import ExpressionNode from '../core/ExpressionNode.js';
import FunctionCallNode from '../core/FunctionCallNode.js';
import FunctionNode from '../core/FunctionNode.js';
import InstanceIndexNode from '../core/InstanceIndexNode.js';
import PropertyNode from '../core/PropertyNode.js';
import UniformNode from '../core/UniformNode.js';
import VarNode from '../core/VarNode.js';
import VaryNode from '../core/VaryNode.js';

// accessors
import BufferNode from '../accessors/BufferNode.js';
import CameraNode from '../accessors/CameraNode.js';
import CubeTextureNode from '../accessors/CubeTextureNode.js';
import InstanceNode from '../accessors/InstanceNode.js';
import MaterialNode from '../accessors/MaterialNode.js';
import MaterialReferenceNode from '../accessors/MaterialReferenceNode.js';
import ModelViewProjectionNode from '../accessors/ModelViewProjectionNode.js';
import NormalNode from '../accessors/NormalNode.js';
import Object3DNode from '../accessors/Object3DNode.js';
import PointUVNode from '../accessors/PointUVNode.js';
import PositionNode from '../accessors/PositionNode.js';
import ReferenceNode from '../accessors/ReferenceNode.js';
import ReflectNode from '../accessors/ReflectNode.js';
import SkinningNode from '../accessors/SkinningNode.js';
import TextureNode from '../accessors/TextureNode.js';
import UVNode from '../accessors/UVNode.js';

// display
import ColorSpaceNode from '../display/ColorSpaceNode.js';
import NormalMapNode from '../display/NormalMapNode.js';
import ToneMappingNode from '../display/ToneMappingNode.js';

// math
import MathNode from '../math/MathNode.js';
import OperatorNode from '../math/OperatorNode.js';
import CondNode from '../math/CondNode.js';

// lights
import LightContextNode from '../lights/LightContextNode.js';
import LightNode from '../lights/LightNode.js';
import LightsNode from '../lights/LightsNode.js';
import ReflectedLightNode from '../lights/ReflectedLightNode.js';

// utils
import ArrayElementNode from '../utils/ArrayElementNode.js';
import MatcapUVNode from '../utils/MatcapUVNode.js';
import MaxMipLevelNode from '../utils/MaxMipLevelNode.js';
import OscNode from '../utils/OscNode.js';
import SpriteSheetUVNode from '../utils/SpriteSheetUVNode.js';
import TimerNode from '../utils/TimerNode.js';

// procedural
import CheckerNode from '../procedural/CheckerNode.js';

// fog
import FogNode from '../fog/FogNode.js';
import FogRangeNode from '../fog/FogRangeNode.js';

// shader node utils
import ShaderNode from './ShaderNode.js';
import { nodeObject, nodeObjects, nodeArray, nodeProxy, nodeImmutable, ConvertType, getConstNodeType, cacheMaps } from './ShaderNodeUtils.js';

//
// Node Material Shader Syntax
//

// functions

export { default as BRDF_GGX } from '../functions/BSDF/BRDF_GGX.js'; // see https://github.com/tc39/proposal-export-default-from
export { default as BRDF_Lambert } from '../functions/BSDF/BRDF_Lambert.js';
export { default as D_GGX } from '../functions/BSDF/D_GGX.js';
export { default as F_Schlick } from '../functions/BSDF/F_Schlick.js';
export { default as V_GGX_SmithCorrelated } from '../functions/BSDF/V_GGX_SmithCorrelated.js';

export { default as getDistanceAttenuation } from '../functions/light/getDistanceAttenuation.js';

export { default as getGeometryRoughness } from '../functions/material/getGeometryRoughness.js';
export { default as getRoughness } from '../functions/material/getRoughness.js';

export { default as PhysicalLightingModel } from '../functions/PhysicalLightingModel.js';

// shader node utils

export { ShaderNode, nodeObject, nodeObjects, nodeArray, nodeProxy, nodeImmutable };

export const color = new ConvertType( 'color' );

export const float = new ConvertType( 'float', cacheMaps.float );
export const int = new ConvertType( 'int', cacheMaps.int );
export const uint = new ConvertType( 'uint', cacheMaps.uint );
export const bool = new ConvertType( 'bool', cacheMaps.bool );

export const vec2 = new ConvertType( 'vec2' );
export const ivec2 = new ConvertType( 'ivec2' );
export const uvec2 = new ConvertType( 'uvec2' );
export const bvec2 = new ConvertType( 'bvec2' );

export const vec3 = new ConvertType( 'vec3' );
export const ivec3 = new ConvertType( 'ivec3' );
export const uvec3 = new ConvertType( 'uvec3' );
export const bvec3 = new ConvertType( 'bvec3' );

export const vec4 = new ConvertType( 'vec4' );
export const ivec4 = new ConvertType( 'ivec4' );
export const uvec4 = new ConvertType( 'uvec4' );
export const bvec4 = new ConvertType( 'bvec4' );

export const mat3 = new ConvertType( 'mat3' );
export const imat3 = new ConvertType( 'imat3' );
export const umat3 = new ConvertType( 'umat3' );
export const bmat3 = new ConvertType( 'bmat3' );

export const mat4 = new ConvertType( 'mat4' );
export const imat4 = new ConvertType( 'imat4' );
export const umat4 = new ConvertType( 'umat4' );
export const bmat4 = new ConvertType( 'bmat4' );

// core

// @TODO: ArrayUniformNode

export const toFunction = ( node ) => {

	node = nodeObject( new FunctionNode( node.code || node ) );

	const call = node.call.bind( node );
	node.call = ( params ) => nodeObject( call( params ) );

	return node;

};

export const uniform = ( nodeOrType ) => {

	const nodeType = getConstNodeType( nodeOrType );

	// TODO: get ConstNode from .traverse() in the future
	const value = nodeOrType.isNode === true ? nodeOrType.node?.value || nodeOrType.value : nodeOrType;

	return nodeObject( new UniformNode( value, nodeType ) );

};

export const attribute = ( name, nodeOrType ) => nodeObject( new AttributeNode( name, getConstNodeType( nodeOrType ) ) );
export const property = ( name, nodeOrType ) => nodeObject( new PropertyNode( name, getConstNodeType( nodeOrType ) ) );

export const bypass = nodeProxy( BypassNode );
export const code = nodeProxy( CodeNode );
export const context = nodeProxy( ContextNode );
export const expression = nodeProxy( ExpressionNode );
export const functionCall = nodeProxy( FunctionCallNode );
export const instanceIndex = nodeImmutable( InstanceIndexNode );
export const label = nodeProxy( VarNode );
export const vary = nodeProxy( VaryNode );

// accessors

export const buffer = ( value, nodeOrType, count ) => nodeObject( new BufferNode( value, getConstNodeType( nodeOrType ), count ) );

export const cameraProjectionMatrix = nodeImmutable( CameraNode, CameraNode.PROJECTION_MATRIX );
export const cameraViewMatrix = nodeImmutable( CameraNode, CameraNode.VIEW_MATRIX );
export const cameraNormalMatrix = nodeImmutable( CameraNode, CameraNode.NORMAL_MATRIX );
export const cameraWorldMatrix = nodeImmutable( CameraNode, CameraNode.WORLD_MATRIX );
export const cameraPosition = nodeImmutable( CameraNode, CameraNode.POSITION );

export const cubeTexture = nodeProxy( CubeTextureNode );
export const texture = nodeProxy( TextureNode );
export const sampler = ( texture ) => nodeObject( new ConvertNode( texture.isNode === true ? texture : new TextureNode( texture ), sampler ) );
export const uv = ( ...params ) => nodeObject( new UVNode( ...params ) );
export const pointUV = nodeImmutable( PointUVNode );

export const instance = nodeProxy( InstanceNode );

export const materialAlphaTest = nodeImmutable( MaterialNode, MaterialNode.ALPHA_TEST );
export const materialColor = nodeImmutable( MaterialNode, MaterialNode.COLOR );
export const materialOpacity = nodeImmutable( MaterialNode, MaterialNode.OPACITY );
export const materialSpecular = nodeImmutable( MaterialNode, MaterialNode.SPECULAR );
export const materialRoughness = nodeImmutable( MaterialNode, MaterialNode.ROUGHNESS );
export const materialMetalness = nodeImmutable( MaterialNode, MaterialNode.METALNESS );

export const diffuseColor = nodeImmutable( PropertyNode, 'DiffuseColor', 'vec4' );
export const roughness = nodeImmutable( PropertyNode, 'Roughness', 'float' );
export const metalness = nodeImmutable( PropertyNode, 'Metalness', 'float' );
export const alphaTest = nodeImmutable( PropertyNode, 'AlphaTest', 'float' );
export const specularColor = nodeImmutable( PropertyNode, 'SpecularColor', 'color' );

export const reference = ( name, nodeOrType, object ) => nodeObject( new ReferenceNode( name, getConstNodeType( nodeOrType ), object ) );
export const materialReference = ( name, nodeOrType, material ) => nodeObject( new MaterialReferenceNode( name, getConstNodeType( nodeOrType ), material ) );

export const modelViewProjection = nodeProxy( ModelViewProjectionNode );

export const normalGeometry = nodeImmutable( NormalNode, NormalNode.GEOMETRY );
export const normalLocal = nodeImmutable( NormalNode, NormalNode.LOCAL );
export const normalWorld = nodeImmutable( NormalNode, NormalNode.WORLD );
export const normalView = nodeImmutable( NormalNode, NormalNode.VIEW );
export const transformedNormalView = nodeImmutable( VarNode, normalView, 'TransformedNormalView' );

export const viewMatrix = nodeProxy( Object3DNode, Object3DNode.VIEW_MATRIX );
export const normalMatrix = nodeProxy( Object3DNode, Object3DNode.NORMAL_MATRIX );
export const worldMatrix = nodeProxy( Object3DNode, Object3DNode.WORLD_MATRIX );
export const position = nodeProxy( Object3DNode, Object3DNode.POSITION );
export const viewPosition = nodeProxy( Object3DNode, Object3DNode.VIEW_POSITION );

export const positionGeometry = nodeImmutable( PositionNode, PositionNode.GEOMETRY );
export const positionLocal = nodeImmutable( PositionNode, PositionNode.LOCAL );
export const positionWorld = nodeImmutable( PositionNode, PositionNode.WORLD );
export const positionView = nodeImmutable( PositionNode, PositionNode.VIEW );
export const positionViewDirection = nodeImmutable( PositionNode, PositionNode.VIEW_DIRECTION );

export const reflectVector = nodeImmutable( ReflectNode, ReflectNode.VECTOR );
export const reflectCube = nodeImmutable( ReflectNode, ReflectNode.CUBE );

export const skinning = nodeProxy( SkinningNode );

// display

export const colorSpace = ( node, encoding ) => nodeObject( new ColorSpaceNode( null, nodeObject( node ) ).fromEncoding( encoding ) );
export const normalMap = nodeProxy( NormalMapNode );
export const toneMapping = ( mapping, exposure, color ) => nodeObject( new ToneMappingNode( mapping, nodeObject( exposure ), nodeObject( color ) ) );

// math

export const EPSILON = float( 1e-6 );
export const INFINITY = float( 1e6 );

export const cond = nodeProxy( CondNode );

export const add = nodeProxy( OperatorNode, '+' );
export const sub = nodeProxy( OperatorNode, '-' );
export const mul = nodeProxy( OperatorNode, '*' );
export const div = nodeProxy( OperatorNode, '/' );
export const remainder = nodeProxy( OperatorNode, '%' );
export const equal = nodeProxy( OperatorNode, '==' );
export const assign = nodeProxy( OperatorNode, '=' );
export const lessThan = nodeProxy( OperatorNode, '<' );
export const greaterThan = nodeProxy( OperatorNode, '>' );
export const lessThanEqual = nodeProxy( OperatorNode, '<=' );
export const greaterThanEqual = nodeProxy( OperatorNode, '>=' );
export const and = nodeProxy( OperatorNode, '&&' );
export const or = nodeProxy( OperatorNode, '||' );
export const xor = nodeProxy( OperatorNode, '^^' );
export const bitAnd = nodeProxy( OperatorNode, '&' );
export const bitOr = nodeProxy( OperatorNode, '|' );
export const bitXor = nodeProxy( OperatorNode, '^' );
export const shiftLeft = nodeProxy( OperatorNode, '<<' );
export const shiftRight = nodeProxy( OperatorNode, '>>' );

export const rad = nodeProxy( MathNode, MathNode.RAD );
export const deg = nodeProxy( MathNode, MathNode.DEG );
export const exp = nodeProxy( MathNode, MathNode.EXP );
export const exp2 = nodeProxy( MathNode, MathNode.EXP2 );
export const log = nodeProxy( MathNode, MathNode.LOG );
export const log2 = nodeProxy( MathNode, MathNode.LOG2 );
export const sqrt = nodeProxy( MathNode, MathNode.SQRT );
export const invSqrt = nodeProxy( MathNode, MathNode.INV_SQRT );
export const floor = nodeProxy( MathNode, MathNode.FLOOR );
export const ceil = nodeProxy( MathNode, MathNode.CEIL );
export const normalize = nodeProxy( MathNode, MathNode.NORMALIZE );
export const fract = nodeProxy( MathNode, MathNode.FRACT );
export const sin = nodeProxy( MathNode, MathNode.SIN );
export const cos = nodeProxy( MathNode, MathNode.COS );
export const tan = nodeProxy( MathNode, MathNode.TAN );
export const asin = nodeProxy( MathNode, MathNode.ASIN );
export const acos = nodeProxy( MathNode, MathNode.ACOS );
export const atan = nodeProxy( MathNode, MathNode.ATAN );
export const abs = nodeProxy( MathNode, MathNode.ABS );
export const sign = nodeProxy( MathNode, MathNode.SIGN );
export const length = nodeProxy( MathNode, MathNode.LENGTH );
export const negate = nodeProxy( MathNode, MathNode.NEGATE );
export const invert = nodeProxy( MathNode, MathNode.INVERT );
export const dFdx = nodeProxy( MathNode, MathNode.DFDX );
export const dFdy = nodeProxy( MathNode, MathNode.DFDY );
export const saturate = nodeProxy( MathNode, MathNode.SATURATE );
export const round = nodeProxy( MathNode, MathNode.ROUND );

export const min = nodeProxy( MathNode, MathNode.MIN );
export const max = nodeProxy( MathNode, MathNode.MAX );
export const mod = nodeProxy( MathNode, MathNode.MOD );
export const step = nodeProxy( MathNode, MathNode.STEP );
export const reflect = nodeProxy( MathNode, MathNode.REFLECT );
export const distance = nodeProxy( MathNode, MathNode.DISTANCE );
export const dot = nodeProxy( MathNode, MathNode.DOT );
export const cross = nodeProxy( MathNode, MathNode.CROSS );
export const pow = nodeProxy( MathNode, MathNode.POW );
export const pow2 = nodeProxy( MathNode, MathNode.POW, 2 );
export const pow3 = nodeProxy( MathNode, MathNode.POW, 3 );
export const pow4 = nodeProxy( MathNode, MathNode.POW, 4 );
export const transformDirection = nodeProxy( MathNode, MathNode.TRANSFORM_DIRECTION );

export const mix = nodeProxy( MathNode, MathNode.MIX );
export const clamp = nodeProxy( MathNode, MathNode.CLAMP );
export const refract = nodeProxy( MathNode, MathNode.REFRACT );
export const smoothstep = nodeProxy( MathNode, MathNode.SMOOTHSTEP );
export const faceforward = nodeProxy( MathNode, MathNode.FACEFORWARD );

// lights

export const lightContext = nodeProxy( LightContextNode );
export const light = nodeProxy( LightNode );
export const fromLights = ( lights ) => nodeObject( new LightsNode().fromLights( lights ) );
export const reflectedLight = nodeImmutable( ReflectedLightNode );

// utils

export const element = nodeProxy( ArrayElementNode );
export const arrayElement = element;

export const matcapUV = nodeImmutable( MatcapUVNode );
export const maxMipLevel = nodeProxy( MaxMipLevelNode );

export const oscSine = nodeProxy( OscNode, OscNode.SINE );
export const oscSquare = nodeProxy( OscNode, OscNode.SQUARE );
export const oscTriangle = nodeProxy( OscNode, OscNode.TRIANGLE );
export const oscSawtooth = nodeProxy( OscNode, OscNode.SAWTOOTH );

export const spritesheetUV = nodeProxy( SpriteSheetUVNode );

export const timerLocal = nodeImmutable( TimerNode, TimerNode.LOCAL );
export const timerGlobal = nodeImmutable( TimerNode, TimerNode.GLOBAL );
export const timerDelta = nodeImmutable( TimerNode, TimerNode.DELTA );

// procedural

export const checker = nodeProxy( CheckerNode );

// fog

export const fog = nodeProxy( FogNode );
export const rangeFog = nodeProxy( FogRangeNode );

// miscellaneous

export const dotNV = saturate( dot( transformedNormalView, positionViewDirection ) );
