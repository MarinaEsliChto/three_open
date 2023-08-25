import { SRGBColorSpace, LinearSRGBColorSpace, DisplayP3ColorSpace, LinearDisplayP3ColorSpace, Rec709Primaries, P3Primaries, SRGBTransfer, LinearTransfer, NoColorSpace, } from '../constants.js';
import { Matrix3 } from './Matrix3.js';

export function SRGBToLinear( c ) {

	return ( c < 0.04045 ) ? c * 0.0773993808 : Math.pow( c * 0.9478672986 + 0.0521327014, 2.4 );

}

export function LinearToSRGB( c ) {

	return ( c < 0.0031308 ) ? c * 12.92 : 1.055 * ( Math.pow( c, 0.41666 ) ) - 0.055;

}

/**
 * Matrices converting P3 <-> Rec. 709 primaries, without gamut mapping
 * or clipping. Based on W3C specifications for sRGB and Display P3,
 * and ICC specifications for the D50 connection space. Values in/out
 * are _linear_ sRGB and _linear_ Display P3.
 *
 * Note that both sRGB and Display P3 use the sRGB transfer functions.
 *
 * Reference:
 * - http://www.russellcottrell.com/photo/matrixCalculator.htm
 */

const LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = /*@__PURE__*/ new Matrix3().fromArray( [
	0.8224621, 0.0331941, 0.0170827,
	0.1775380, 0.9668058, 0.0723974,
	- 0.0000001, 0.0000001, 0.9105199
] );

const LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = /*@__PURE__*/ new Matrix3().fromArray( [
	1.2249401, - 0.0420569, - 0.0196376,
	- 0.2249404, 1.0420571, - 0.0786361,
	0.0000001, 0.0000000, 1.0982735
] );

function DisplayP3ToLinearSRGB( color ) {

	// Display P3 uses the sRGB transfer functions
	return color.convertSRGBToLinear().applyMatrix3( LINEAR_DISPLAY_P3_TO_LINEAR_SRGB );

}

function LinearSRGBToDisplayP3( color ) {

	// Display P3 uses the sRGB transfer functions
	return color.applyMatrix3( LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 ).convertLinearToSRGB();

}

function LinearDisplayP3ToLinearSRGB( color ) {

	return color.applyMatrix3( LINEAR_DISPLAY_P3_TO_LINEAR_SRGB );

}

function LinearSRGBToLinearDisplayP3( color ) {

	return color.applyMatrix3( LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 );

}

// Conversions from <source> to Linear-sRGB reference space.
const TO_REFERENCE = {
	[ LinearSRGBColorSpace ]: ( color ) => color,
	[ SRGBColorSpace ]: ( color ) => color.convertSRGBToLinear(),
	[ DisplayP3ColorSpace ]: DisplayP3ToLinearSRGB,
	[ LinearDisplayP3ColorSpace ]: LinearDisplayP3ToLinearSRGB,
};

// Conversions to <target> from Linear-sRGB reference space.
const FROM_REFERENCE = {
	[ LinearSRGBColorSpace ]: ( color ) => color,
	[ SRGBColorSpace ]: ( color ) => color.convertLinearToSRGB(),
	[ LinearDisplayP3ColorSpace ]: LinearSRGBToLinearDisplayP3,
	[ DisplayP3ColorSpace ]: LinearSRGBToDisplayP3,
};

const COLOR_SPACE_COMPONENTS = {
	[ NoColorSpace ]: { transfer: LinearTransfer, primaries: undefined },
	[ LinearSRGBColorSpace ]: { transfer: LinearTransfer, primaries: Rec709Primaries },
	[ SRGBColorSpace ]: { transfer: SRGBTransfer, primaries: Rec709Primaries },
	[ LinearDisplayP3ColorSpace ]: { transfer: LinearTransfer, primaries: P3Primaries },
	[ DisplayP3ColorSpace ]: { transfer: SRGBTransfer, primaries: P3Primaries },
};

const SUPPORTED_WORKING_COLOR_SPACES = new Set( [ LinearSRGBColorSpace, LinearDisplayP3ColorSpace ] );

export const ColorManagement = {

	enabled: true,

	_workingColorSpace: LinearSRGBColorSpace,

	get legacyMode() {

		console.warn( 'THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150.' );

		return ! this.enabled;

	},

	set legacyMode( legacyMode ) {

		console.warn( 'THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150.' );

		this.enabled = ! legacyMode;

	},

	get workingColorSpace() {

		return this._workingColorSpace;

	},

	set workingColorSpace( colorSpace ) {

		if ( ! SUPPORTED_WORKING_COLOR_SPACES.has( colorSpace ) ) {

			throw new Error( `Unsupported working color space, "${ colorSpace }".` );

		}

		this._workingColorSpace = colorSpace;

	},

	convert: function ( color, sourceColorSpace, targetColorSpace ) {

		if ( this.enabled === false || sourceColorSpace === targetColorSpace || ! sourceColorSpace || ! targetColorSpace ) {

			return color;

		}

		const sourceToLinear = TO_REFERENCE[ sourceColorSpace ];
		const targetFromLinear = FROM_REFERENCE[ targetColorSpace ];

		if ( sourceToLinear === undefined || targetFromLinear === undefined ) {

			throw new Error( `Unsupported color space conversion, "${ sourceColorSpace }" to "${ targetColorSpace }".` );

		}

		return targetFromLinear( sourceToLinear( color ) );

	},

	fromWorkingColorSpace: function ( color, targetColorSpace ) {

		return this.convert( color, this._workingColorSpace, targetColorSpace );

	},

	toWorkingColorSpace: function ( color, sourceColorSpace ) {

		return this.convert( color, sourceColorSpace, this._workingColorSpace );

	},

	getPrimaries: function ( colorSpace ) {

		return COLOR_SPACE_COMPONENTS[ colorSpace ].primaries;

	},

	getTransfer: function ( colorSpace ) {

		return COLOR_SPACE_COMPONENTS[ colorSpace ].transfer;

	},

};
