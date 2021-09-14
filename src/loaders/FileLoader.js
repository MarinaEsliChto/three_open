import { Cache } from './Cache.js';
import { Loader } from './Loader.js';

const loading = {};

class FileLoader extends Loader {

	constructor( manager ) {

		super( manager );

	}

	load( url, onLoad, onProgress, onError ) {

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const scope = this;

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		// Check if request is duplicate

		if ( loading[ url ] !== undefined ) {

			loading[ url ].push( {

				onLoad: onLoad,
				onProgress: onProgress,
				onError: onError

			} );

			return;

		}

		// Initialise array for duplicate requests
		loading[ url ] = [];

		loading[ url ].push( {
			onLoad: onLoad,
			onProgress: onProgress,
			onError: onError,
		} );

		// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType
		// if (this.responseType !== undefined) {
		//   request.responseType = this.responseType;
		// }

		// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/overrideMimeType
		// if (request.overrideMimeType) {
		//   request.overrideMimeType(
		//     this.mimeType !== undefined ? this.mimeType : "text/plain",
		//   );
		// }

		// TODO-DefinitelyMaybe: Confirm if Safari can handle Data URIs through fetch
		// create request
		const req = new Request( url, {
			headers: new Headers( this.requestHeader ),
			credentials: this.withCredentials ? 'include' : 'same-origin',
			// TODO-DefinitelyMaybe: Could add an abort controller?
			// signal: this.attachSignal ? this.signal : undefined;
		} );

		// start the fetch
		fetch( req )
			.then( response => {

				if ( response.status === 200 || response.status === 0 ) {

					// Some browsers return HTTP Status 0 when using non-http protocol
					// e.g. 'file://' or 'data://'. Handle as success.

					if ( response.status === 0 ) {

						console.warn( 'THREE.FileLoader: HTTP Status 0 received.' );

					}

					const callbacks = loading[ url ];
					const reader = response.body.getReader();
					let loaded = 0;
					const total = parseInt( response.headers.get( 'Content-Length' ) );


					// periodically read data into the new stream tracking while download progress
					return new ReadableStream( {
						start( controller ) {

							readData();

							function readData() {

								reader.read()
									.then( ( { done, value } ) => {

										if ( done ) {

											controller.close();

										} else {

											loaded += value.byteLength;

											const event = new ProgressEvent( 'progress', { lengthComputable: true, loaded, total } );
											for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

												const callback = callbacks[ i ];
												if ( callback.onProgress ) callback.onProgress( event );

											}

											controller.enqueue( value );
											readData();

										}

									} );

							}

						}
        	} );

				} else {

					const callbacks = loading[ url ];
					delete loading[ url ];

					for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

						const callback = callbacks[ i ];
						if ( callback.onError ) callback.onError( response.statusText );

					}

					scope.manager.itemError( url );
					scope.manager.itemEnd( url );

				}

			} )
			.then( async stream => {

				const response = new Response( stream );

				switch ( this.responseType ) {

					case 'arraybuffer':

						return response.arrayBuffer();

					case 'blob':

						return response.blob();

					case 'document':

						return response.text()
							.then( text => {

								const parser = new DOMParser();
								return parser.parseFromString( text, this.mimeType );

							} );

					case 'json':

						return response.json();

					default:

						return response.text();

				}

			} )
			.then( data => {

				// Add to cache only on HTTP success, so that we do not cache
				// error response bodies as proper responses to requests.
				Cache.add( url, data );

				const callbacks = loading[ url ];
				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

					const callback = callbacks[ i ];
					if ( callback.onLoad ) callback.onLoad( data );

				}

				scope.manager.itemEnd( url );

			} )
			.catch( ( err ) => {

				// Abort errors and other errors are handled the same

				const callbacks = loading[ url ];
				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

					const callback = callbacks[ i ];
					if ( callback.onError ) callback.onError( err );

				}

				scope.manager.itemError( url );
				scope.manager.itemEnd( url );

			} );

		scope.manager.itemStart( url );

		return;

	}

	setResponseType( value ) {

		this.responseType = value;
		return this;

	}

	setMimeType( value ) {

		this.mimeType = value;
		return this;

	}

}


export { FileLoader };
