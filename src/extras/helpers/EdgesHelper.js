/**
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.EdgesHelper = function ( object, color ) {

	if ( color === undefined ) color = 0xffffff;
	
	this.colors = {
    		main: new THREE.Color()
	};
	this.colors.main.set( color );

	var edge = [ 0, 0 ], hash = {};
	var sortFunction = function ( a, b ) { return a - b; };

	var keys = [ 'a', 'b', 'c' ];
	var geometry = new THREE.BufferGeometry();

	var geometry2;

	if ( object.geometry instanceof THREE.BufferGeometry ) {

		geometry2 = new THREE.Geometry();
		geometry2.fromBufferGeometry( object.geometry );

	} else {

		geometry2 = object.geometry.clone();

	}

	geometry2.mergeVertices();
	geometry2.computeFaceNormals();

	var vertices = geometry2.vertices;
	var faces = geometry2.faces;
	var numEdges = 0;

	for ( var i = 0, l = faces.length; i < l; i ++ ) {

		var face = faces[ i ];

		for ( var j = 0; j < 3; j ++ ) {

			edge[ 0 ] = face[ keys[ j ] ];
			edge[ 1 ] = face[ keys[ ( j + 1 ) % 3 ] ];
			edge.sort( sortFunction );

			var key = edge.toString();

			if ( hash[ key ] === undefined ) {

				hash[ key ] = { vert1: edge[ 0 ], vert2: edge[ 1 ], face1: i, face2: undefined };
				numEdges ++;

			} else {

				hash[ key ].face2 = i;

			}

		}

	}

	var coords = new Float32Array( numEdges * 2 * 3 );

	var index = 0;

	for ( var key in hash ) {

		var h = hash[ key ];

		if ( h.face2 === undefined || faces[ h.face1 ].normal.dot( faces[ h.face2 ].normal ) < 0.9999 ) { // hardwired const OK

			var vertex = vertices[ h.vert1 ];
			coords[ index ++ ] = vertex.x;
			coords[ index ++ ] = vertex.y;
			coords[ index ++ ] = vertex.z;

			vertex = vertices[ h.vert2 ];
			coords[ index ++ ] = vertex.x;
			coords[ index ++ ] = vertex.y;
			coords[ index ++ ] = vertex.z;

		}

	}

	geometry.addAttribute( 'position', new THREE.BufferAttribute( coords, 3 ) );

	THREE.Line.call( this, geometry, new THREE.LineBasicMaterial( { color: this.colors.main } ), THREE.LinePieces );

	this.matrix = object.matrixWorld;
	this.matrixAutoUpdate = false;

};

THREE.EdgesHelper.prototype = Object.create( THREE.Line.prototype );
THREE.EdgesHelper.prototype.constructor = THREE.EdgesHelper;

THREE.EdgesHelper.prototype.setColor = function ( color ) {
	
	this.colors.main.set( color );
	this.material.color.copy( this.colors.main );
	
};
