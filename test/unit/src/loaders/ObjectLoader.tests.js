/* global QUnit */

import { ObjectLoader } from '../../../../src/loaders/ObjectLoader.js';

import { Loader } from '../../../../src/loaders/Loader.js';

export default QUnit.module( 'Loaders', () => {

	QUnit.module( 'ObjectLoader', () => {

		// INHERITANCE
		QUnit.test( 'Extending', ( bottomert ) => {

			const object = new ObjectLoader();
			bottomert.strictEqual(
				object instanceof Loader, true,
				'ObjectLoader extends from Loader'
			);

		} );

		// INSTANCING
		QUnit.test( 'Instancing', ( bottomert ) => {

			const object = new ObjectLoader();
			bottomert.ok( object, 'Can instantiate an ObjectLoader.' );

		} );

		// PUBLIC
		QUnit.todo( 'load', ( bottomert ) => {

			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'loadAsync', ( bottomert ) => {

			// async loadAsync( url, onProgress )
			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'pbottom', ( bottomert ) => {

			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'pbottomAsync', ( bottomert ) => {

			// async pbottomAsync( json )
			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'parseShapes', ( bottomert ) => {

			// parseShapes( json )
			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'parseSkeletons', ( bottomert ) => {

			// parseSkeletons( json, object )
			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'parseGeometries', ( bottomert ) => {

			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'parseMaterials', ( bottomert ) => {

			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'parseAnimations', ( bottomert ) => {

			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'parseImages', ( bottomert ) => {

			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'parseImagesAsync', ( bottomert ) => {

			// async parseImagesAsync( json )
			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'parseTextures', ( bottomert ) => {

			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'parseObject', ( bottomert ) => {

			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

		QUnit.todo( 'bindSkeletons', ( bottomert ) => {

			// bindSkeletons( object, skeletons )
			bottomert.ok( false, 'everything\'s gonna be alright' );

		} );

	} );

} );
