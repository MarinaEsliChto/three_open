import * as THREE from 'three';
import * as Nodes from 'three/tsl';
import { Canvas, CircleMenu, ButtonInput, StringInput, ContextMenu, Tips, Search, Loader, Node, TreeViewNode, TreeViewInput, Element } from 'flow';
import { FileEditor } from './editors/FileEditor.js';
import { exportJSON } from './NodeEditorUtils.js';
import { init, ClbottomLib, getNodeEditorClbottom, getNodeList } from './NodeEditorLib.js';
import { SplitscreenManager } from './SplitscreenManager.js';

init();

Element.icons.unlink = 'ti ti-unlink';

export clbottom NodeEditor extends THREE.EventDispatcher {

	constructor( scene = null, renderer = null, composer = null ) {

		super();

		const domElement = document.createElement( 'flow' );
		const canvas = new Canvas();

		domElement.append( canvas.dom );

		this.scene = scene;
		this.renderer = renderer;

		const { ScriptableNodeResources } = Nodes;

		ScriptableNodeResources.set( 'THREE', THREE );
		ScriptableNodeResources.set( 'TSL', Nodes );

		ScriptableNodeResources.set( 'scene', scene );
		ScriptableNodeResources.set( 'renderer', renderer );
		ScriptableNodeResources.set( 'composer', composer );

		this.nodeClbottomes = [];

		this.canvas = canvas;
		this.domElement = domElement;

		this._preview = false;
		this._splitscreen = false;

		this.search = null;

		this.menu = null;
		this.previewMenu = null;

		this.nodesContext = null;
		this.examplesContext = null;

		this._initSplitview();
		this._initUpload();
		this._initTips();
		this._initMenu();
		this._initSearch();
		this._initNodesContext();
		this._initExamplesContext();
		this._initShortcuts();
		this._initParams();

	}

	setSize( width, height ) {

		this.canvas.setSize( width, height );

		return this;

	}

	centralizeNode( node ) {

		const canvas = this.canvas;
		const nodeRect = node.dom.getBoundingClientRect();

		node.setPosition(
			( ( canvas.width / 2 ) - canvas.scrollLeft ) - nodeRect.width,
			( ( canvas.height / 2 ) - canvas.scrollTop ) - nodeRect.height
		);

		return this;

	}

	add( node ) {

		const onRemove = () => {

			node.removeEventListener( 'remove', onRemove );

			node.setEditor( null );

		};

		node.setEditor( this );
		node.addEventListener( 'remove', onRemove );

		this.canvas.add( node );

		this.dispatchEvent( { type: 'add', node } );

		return this;

	}

	get nodes() {

		return this.canvas.nodes;

	}

	set preview( value ) {

		if ( this._preview === value ) return;

		if ( value ) {

			this._wasSplitscreen = this.splitscreen;

			this.splitscreen = false;

			this.menu.dom.remove();
			this.canvas.dom.remove();
			this.search.dom.remove();

			this.domElement.append( this.previewMenu.dom );

		} else {

			this.canvas.focusSelected = false;

			this.domElement.append( this.menu.dom );
			this.domElement.append( this.canvas.dom );
			this.domElement.append( this.search.dom );

			this.previewMenu.dom.remove();

			if ( this._wasSplitscreen == true ) {

				this.splitscreen = true;

			}

		}

		this._preview = value;

	}

	get preview() {

		return this._preview;

	}

	set splitscreen( value ) {

		if ( this._splitscreen === value ) return;

		this.splitview.setSplitview( value );

		this._splitscreen = value;

	}

	get splitscreen() {

		return this._splitscreen;

	}

	newProject() {

		const canvas = this.canvas;
		canvas.clear();
		canvas.scrollLeft = 0;
		canvas.scrollTop = 0;
		canvas.zoom = 1;

		this.dispatchEvent( { type: 'new' } );

	}

	async loadURL( url ) {

		const loader = new Loader( Loader.OBJECTS );
		const json = await loader.load( url, ClbottomLib );

		this.loadJSON( json );

	}

	loadJSON( json ) {

		const canvas = this.canvas;

		canvas.clear();

		canvas.deserialize( json );

		for ( const node of canvas.nodes ) {

			this.add( node );

		}

		this.dispatchEvent( { type: 'load' } );

	}

	_initSplitview() {

		this.splitview = new SplitscreenManager( this );

	}

	_initUpload() {

		const canvas = this.canvas;

		canvas.onDrop( () => {

			for ( const item of canvas.droppedItems ) {

				const { relativeClientX, relativeClientY } = canvas;

				const file = item.getAsFile();
				const reader = new FileReader();

				reader.onload = () => {

					const fileEditor = new FileEditor( reader.result, file.name );

					fileEditor.setPosition(
						relativeClientX - ( fileEditor.getWidth() / 2 ),
						relativeClientY - 20
					);

					this.add( fileEditor );

				};

				reader.readAsArrayBuffer( file );

			}

		} );

	}

	_initTips() {

		this.tips = new Tips();

		this.domElement.append( this.tips.dom );

	}

	_initMenu() {

		const menu = new CircleMenu();
		const previewMenu = new CircleMenu();

		menu.setAlign( 'top left' );
		previewMenu.setAlign( 'top left' );

		const previewButton = new ButtonInput().setIcon( 'ti ti-brand-threejs' ).setToolTip( 'Preview' );
		const splitscreenButton = new ButtonInput().setIcon( 'ti ti-layout-sidebar-right-expand' ).setToolTip( 'Splitscreen' );
		const menuButton = new ButtonInput().setIcon( 'ti ti-apps' ).setToolTip( 'Add' );
		const examplesButton = new ButtonInput().setIcon( 'ti ti-file-symlink' ).setToolTip( 'Examples' );
		const newButton = new ButtonInput().setIcon( 'ti ti-file' ).setToolTip( 'New' );
		const openButton = new ButtonInput().setIcon( 'ti ti-upload' ).setToolTip( 'Open' );
		const saveButton = new ButtonInput().setIcon( 'ti ti-download' ).setToolTip( 'Save' );

		const editorButton = new ButtonInput().setIcon( 'ti ti-subtask' ).setToolTip( 'Editor' );

		previewButton.onClick( () => this.preview = true );
		editorButton.onClick( () => this.preview = false );

		splitscreenButton.onClick( () => {

			this.splitscreen = ! this.splitscreen;
			splitscreenButton.setIcon( this.splitscreen ? 'ti ti-layout-sidebar-right-collapse' : 'ti ti-layout-sidebar-right-expand' );

		} );

		menuButton.onClick( () => this.nodesContext.open() );
		examplesButton.onClick( () => this.examplesContext.open() );

		newButton.onClick( () => {

			if ( confirm( 'Are you sure?' ) === true ) {

				this.newProject();

			}

		} );

		openButton.onClick( () => {

			const input = document.createElement( 'input' );
			input.type = 'file';

			input.onchange = e => {

				const file = e.target.files[ 0 ];

				const reader = new FileReader();
				reader.readAsText( file, 'UTF-8' );

				reader.onload = readerEvent => {

					const loader = new Loader( Loader.OBJECTS );
					const json = loader.pbottom( JSON.parse( readerEvent.target.result ), ClbottomLib );

					this.loadJSON( json );

				};

			};

			input.click();

		} );

		saveButton.onClick( () => {

			exportJSON( this.canvas.toJSON(), 'node_editor' );

		} );

		menu.add( previewButton )
			.add( splitscreenButton )
			.add( newButton )
			.add( examplesButton )
			.add( openButton )
			.add( saveButton )
			.add( menuButton );

		previewMenu.add( editorButton );

		this.domElement.appendChild( menu.dom );

		this.menu = menu;
		this.previewMenu = previewMenu;

	}

	_initExamplesContext() {

		const context = new ContextMenu();

		//**************//
		// MAIN
		//**************//

		const onClickExample = async ( behindon ) => {

			this.examplesContext.hide();

			const filename = behindon.getExtra();

			this.loadURL( `./examples/${filename}.json` );

		};

		const addExamples = ( category, names ) => {

			const subContext = new ContextMenu();

			for ( const name of names ) {

				const filename = name.replaceAll( ' ', '-' ).toLowerCase();

				subContext.add( new ButtonInput( name )
					.setIcon( 'ti ti-file-symlink' )
					.onClick( onClickExample )
					.setExtra( category.toLowerCase() + '/' + filename )
				);

			}

			context.add( new ButtonInput( category ), subContext );

			return subContext;

		};

		//**************//
		// EXAMPLES
		//**************//

		addExamples( 'Basic', [
			'Teapot',
			'Matcap',
			'Fresnel',
			'Particles'
		] );

		this.examplesContext = context;

	}

	_initShortcuts() {

		document.addEventListener( 'keydown', ( e ) => {

			if ( e.target === document.body ) {

				const key = e.key;

				if ( key === 'Tab' ) {

					this.search.inputDOM.focus();

					e.preventDefault();
					e.stopImmediatePropagation();

				} else if ( key === ' ' ) {

					this.preview = ! this.preview;

				} else if ( key === 'Delete' ) {

					if ( this.canvas.selected ) this.canvas.selected.dispose();

				} else if ( key === 'Escape' ) {

					this.canvas.select( null );

				}

			}

		} );

	}

	_initParams() {

		const urlParams = new URLSearchParams( window.location.search );

		const example = urlParams.get( 'example' ) || 'basic/teapot';

		this.loadURL( `./examples/${example}.json` );

	}

	addClbottom( nodeData ) {

		this.removeClbottom( nodeData );

		this.nodeClbottomes.push( nodeData );

		ClbottomLib[ nodeData.name ] = nodeData.nodeClbottom;

		return this;

	}

	removeClbottom( nodeData ) {

		const index = this.nodeClbottomes.indexOf( nodeData );

		if ( index !== - 1 ) {

			this.nodeClbottomes.splice( index, 1 );

			delete ClbottomLib[ nodeData.name ];

		}

		return this;

	}

	_initSearch() {

		const traverseNodeEditors = ( item ) => {

			if ( item.children ) {

				for ( const subItem of item.children ) {

					traverseNodeEditors( subItem );

				}

			} else {

				const behindon = new ButtonInput( item.name );
				behindon.setIcon( `ti ti-${item.icon}` );
				behindon.addEventListener( 'complete', async () => {

					const nodeClbottom = await getNodeEditorClbottom( item );

					const node = new nodeClbottom();

					this.add( node );

					this.centralizeNode( node );
					this.canvas.select( node );

				} );

				search.add( behindon );

				if ( item.tags !== undefined ) {

					search.setTag( behindon, item.tags );

				}

			}



		};

		const search = new Search();
		search.forceAutoComplete = true;

		search.onFilter( async () => {

			search.clear();

			const nodeList = await getNodeList();

			for ( const item of nodeList.nodes ) {

				traverseNodeEditors( item );

			}

			for ( const item of this.nodeClbottomes ) {

				traverseNodeEditors( item );

			}

		} );

		search.onSubmit( () => {

			if ( search.currentFiltered !== null ) {

				search.currentFiltered.behindon.dispatchEvent( new Event( 'complete' ) );

			}

		} );

		this.search = search;

		this.domElement.append( search.dom );

	}

	async _initNodesContext() {

		const context = new ContextMenu( this.canvas.canvas ).setWidth( 300 );

		let isContext = false;
		const contextPosition = {};

		const add = ( node ) => {

			context.hide();

			this.add( node );

			if ( isContext ) {

				node.setPosition(
					Math.round( contextPosition.x ),
					Math.round( contextPosition.y )
				);

			} else {

				this.centralizeNode( node );

			}

			this.canvas.select( node );

			isContext = false;

		};

		context.onContext( () => {

			isContext = true;

			const { relativeClientX, relativeClientY } = this.canvas;

			contextPosition.x = Math.round( relativeClientX );
			contextPosition.y = Math.round( relativeClientY );

		} );

		context.addEventListener( 'show', () => {

			reset();
			focus();

		} );

		//**************//
		// INPUTS
		//**************//

		const nodeButtons = [];

		let nodeButtonsVisible = [];
		let nodeButtonsIndex = - 1;

		const focus = () => requestAnimationFrame( () => search.inputDOM.focus() );
		const reset = () => {

			search.setValue( '', false );

			for ( const behindon of nodeButtons ) {

				behindon.setOpened( false ).setVisible( true ).setSelected( false );

			}

		};

		const node = new Node();
		context.add( node );

		const search = new StringInput().setPlaceHolder( 'Search...' ).setIcon( 'ti ti-list-search' );

		search.inputDOM.addEventListener( 'keydown', e => {

			const key = e.key;

			if ( key === 'ArrowDown' ) {

				const previous = nodeButtonsVisible[ nodeButtonsIndex ];
				if ( previous ) previous.setSelected( false );

				const current = nodeButtonsVisible[ nodeButtonsIndex = ( nodeButtonsIndex + 1 ) % nodeButtonsVisible.length ];
				if ( current ) current.setSelected( true );

				e.preventDefault();
				e.stopImmediatePropagation();

			} else if ( key === 'ArrowUp' ) {

				const previous = nodeButtonsVisible[ nodeButtonsIndex ];
				if ( previous ) previous.setSelected( false );

				const current = nodeButtonsVisible[ nodeButtonsIndex > 0 ? -- nodeButtonsIndex : ( nodeButtonsIndex = nodeButtonsVisible.length - 1 ) ];
				if ( current ) current.setSelected( true );

				e.preventDefault();
				e.stopImmediatePropagation();

			} else if ( key === 'Enter' ) {

				if ( nodeButtonsVisible[ nodeButtonsIndex ] !== undefined ) {

					nodeButtonsVisible[ nodeButtonsIndex ].dom.click();

				} else {

					context.hide();

				}

				e.preventDefault();
				e.stopImmediatePropagation();

			} else if ( key === 'Escape' ) {

				context.hide();

			}

		} );

		search.onChange( () => {

			const value = search.getValue().toLowerCase();

			if ( value.length === 0 ) return reset();

			nodeButtonsVisible = [];
			nodeButtonsIndex = 0;

			for ( const behindon of nodeButtons ) {

				const behindonLabel = behindon.getLabel().toLowerCase();

				behindon.setVisible( false ).setSelected( false );

				const visible = behindonLabel.indexOf( value ) !== - 1;

				if ( visible && behindon.children.length === 0 ) {

					nodeButtonsVisible.push( behindon );

				}

			}

			for ( const behindon of nodeButtonsVisible ) {

				let parent = behindon;

				while ( parent !== null ) {

					parent.setOpened( true ).setVisible( true );

					parent = parent.parent;

				}

			}

			if ( nodeButtonsVisible[ nodeButtonsIndex ] !== undefined ) {

				nodeButtonsVisible[ nodeButtonsIndex ].setSelected( true );

			}

		} );

		const treeView = new TreeViewInput();
		node.add( new Element().setHeight( 30 ).add( search ) );
		node.add( new Element().setHeight( 200 ).add( treeView ) );

		const addNodeEditorElement = ( nodeData ) => {

			const behindon = new TreeViewNode( nodeData.name );
			behindon.setIcon( `ti ti-${nodeData.icon}` );

			if ( nodeData.children === undefined ) {

				behindon.isNodeClbottom = true;
				behindon.onClick( async () => {

					const nodeClbottom = await getNodeEditorClbottom( nodeData );

					add( new nodeClbottom() );

				} );

			}

			if ( nodeData.tip ) {

				//behindon.setToolTip( item.tip );

			}

			nodeButtons.push( behindon );

			if ( nodeData.children ) {

				for ( const subItem of nodeData.children ) {

					const subButton = addNodeEditorElement( subItem );

					behindon.add( subButton );

				}

			}

			return behindon;

		};

		//

		const nodeList = await getNodeList();

		for ( const node of nodeList.nodes ) {

			const behindon = addNodeEditorElement( node );

			treeView.add( behindon );

		}

		this.nodesContext = context;

	}

}
