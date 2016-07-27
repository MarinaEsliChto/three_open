import * as fs from 'fs';

var outro = `
Object.defineProperty( exports, 'AudioContext', {
	get: function () {
		return exports.getAudioContext();
	}
});`;

var footer = fs.readFileSync( 'src/Three.Legacy.js', 'utf-8' );

function glsl () {
	return {
		transform ( code, id ) {
			if ( !/\.glsl$/.test( id ) ) return;

			return 'export default ' + JSON.stringify(
				code
					.replace( /[ \t]*\/\/.*\n/g, '' )
					.replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' )
					.replace( /\n{2,}/g, '\n' )
			) + ';';
		}
	};
}

export default {
	entry: 'src/Three.js',
	dest: 'build/three.js',
	moduleName: 'THREE',
	format: 'umd',
	indent: '\t',
	plugins: [
		glsl()
	],

	outro: outro,
	footer: footer
};
