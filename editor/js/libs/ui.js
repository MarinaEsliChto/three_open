/**
 * @author mrdoob / http://mrdoob.com/
 */

var UI = {};

UI.Element = function ( dom ) {

	this.dom = dom;

};

UI.Element.prototype = {

	setId: function ( id ) {

		this.dom.id = id;
		
		return this;

	},

	setClass: function ( name ) {

		this.dom.className = name;

		return this;

	},

	setStyle: function ( style, array ) {

		for ( var i = 0; i < array.length; i ++ ) {

			this.dom.style[ style ] = array[ i ];

		}

	},

	setDisabled: function ( value ) {

		this.dom.disabled = value;

		return this;

	},

	setTextContent: function ( value ) {

		this.dom.textContent = value;

		return this;

	},

	setTitle: function ( name ) {

		this.dom.title = name;
		
		return this;

	}

}

// properties

var properties = [ 'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft',
'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textAlign', 'textDecoration', 'textTransform', 'cursor', 'zIndex' ];

properties.forEach( function ( property ) {

	var method = 'set' + property.substr( 0, 1 ).toUpperCase() + property.substr( 1, property.length );

	UI.Element.prototype[ method ] = function () {

		this.setStyle( property, arguments );
		return this;

	};

} );

// events

var events = [ 'KeyUp', 'KeyDown', 'MouseOver', 'MouseOut', 'Click', 'DblClick', 'Change' ];

events.forEach( function ( event ) {

	var method = 'on' + event;

	UI.Element.prototype[ method ] = function ( callback ) {

		this.dom.addEventListener( event.toLowerCase(), callback.bind( this ), false );

		return this;

	};

} );


// Panel

UI.Panel = function () {

	UI.Element.call( this );

	var dom = document.createElement( 'div' );
	dom.className = 'Panel';

	this.dom = dom;

	return this;
};

UI.Panel.prototype = Object.create( UI.Element.prototype );
UI.Panel.prototype.constructor = UI.Panel;

UI.Panel.prototype.add = function () {

	for ( var i = 0; i < arguments.length; i ++ ) {

		var argument = arguments[ i ];

		if ( argument instanceof UI.Element ) {

			this.dom.appendChild( argument.dom );

		} else {

			console.error( 'UI.Panel:', argument, 'is not an instance of UI.Element.' )

		}

	}

	return this;

};


UI.Panel.prototype.remove = function () {

	for ( var i = 0; i < arguments.length; i ++ ) {
	
		var argument = arguments[ i ];

		if ( argument instanceof UI.Element ) {

			this.dom.removeChild( argument.dom );

		} else {

			console.error( 'UI.Panel:', argument, 'is not an instance of UI.Element.' )

		}

	}

	return this;

};

UI.Panel.prototype.clear = function () {

	while ( this.dom.children.length ) {

		this.dom.removeChild( this.dom.lastChild );

	}

};


// Collapsible Panel

UI.CollapsiblePanel = function () {

	UI.Panel.call( this );

	this.setClass( 'Panel Collapsible' );

	var scope = this;

	this.static = new UI.Panel();
	this.static.setClass( 'Static' );
	this.static.onClick( function () {
		scope.toggle();
	} );
	this.dom.appendChild( this.static.dom );

	this.contents = new UI.Panel();
	this.contents.setClass( 'Content' );
	this.dom.appendChild( this.contents.dom );

	var button = new UI.Panel();
	button.setClass( 'Button' );
	this.static.add( button );

	this.isCollapsed = false;

	return this;

};

UI.CollapsiblePanel.prototype = Object.create( UI.Panel.prototype );
UI.CollapsiblePanel.prototype.constructor = UI.CollapsiblePanel;

UI.CollapsiblePanel.prototype.addStatic = function () {

	this.static.add.apply( this.static, arguments );
	return this;

};

UI.CollapsiblePanel.prototype.removeStatic = function () {

	this.static.remove.apply( this.static, arguments );
	return this;

};

UI.CollapsiblePanel.prototype.clearStatic = function () {

	this.static.clear();
	return this;

};

UI.CollapsiblePanel.prototype.add = function () {

	this.contents.add.apply( this.contents, arguments );
	return this;

};

UI.CollapsiblePanel.prototype.remove = function () {

	this.contents.remove.apply( this.contents, arguments );
	return this;

};

UI.CollapsiblePanel.prototype.clear = function () {

	this.contents.clear();
	return this;

};

UI.CollapsiblePanel.prototype.toggle = function() {

	this.setCollapsed( !this.isCollapsed );

};

UI.CollapsiblePanel.prototype.collapse = function() {

	this.setCollapsed( true );

};

UI.CollapsiblePanel.prototype.expand = function() {

	this.setCollapsed( false );

};

UI.CollapsiblePanel.prototype.setCollapsed = function( boolean ) {

	if ( boolean ) {

		this.dom.classList.add( 'collapsed' );

	} else {

		this.dom.classList.remove( 'collapsed' );

	}

	this.isCollapsed = boolean;

	if ( this.onCollapsedChangeCallback !== undefined ) {

		this.onCollapsedChangeCallback( boolean );

	}

};

UI.CollapsiblePanel.prototype.onCollapsedChange = function ( callback ) {

	this.onCollapsedChangeCallback = callback;

};

// Text

UI.Text = function ( text ) {

	UI.Element.call( this );

	var dom = document.createElement( 'span' );
	dom.className = 'Text';
	dom.style.cursor = 'default';
	dom.style.display = 'inline-block';
	dom.style.verticalAlign = 'middle';

	this.dom = dom;
	this.setValue( text );

	return this;

};

UI.Text.prototype = Object.create( UI.Element.prototype );
UI.Text.prototype.constructor = UI.Text;

UI.Text.prototype.getValue = function () {

	return this.dom.textContent;

};

UI.Text.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		this.dom.textContent = value;

	}

	return this;

};


// Input

UI.Input = function ( text ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Input';
	dom.style.padding = '2px';
	dom.style.border = '1px solid transparent';

	dom.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

	}, false );

	this.dom = dom;
	this.setValue( text );

	return this;

};

UI.Input.prototype = Object.create( UI.Element.prototype );
UI.Input.prototype.constructor = UI.Input;

UI.Input.prototype.getValue = function () {

	return this.dom.value;

};

UI.Input.prototype.setValue = function ( value ) {

	this.dom.value = value;

	return this;

};


// TextArea

UI.TextArea = function () {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'textarea' );
	dom.className = 'TextArea';
	dom.style.padding = '2px';
	dom.spellcheck = false;

	dom.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

		if ( event.keyCode === 9 ) {

			event.preventDefault();

			var cursor = dom.selectionStart;

			dom.value = dom.value.substring( 0, cursor ) + '\t' + dom.value.substring( cursor );
			dom.selectionStart = cursor + 1;
			dom.selectionEnd = dom.selectionStart;

		}

	}, false );

	this.dom = dom;

	return this;

};

UI.TextArea.prototype = Object.create( UI.Element.prototype );
UI.TextArea.prototype.constructor = UI.TextArea;

UI.TextArea.prototype.getValue = function () {

	return this.dom.value;

};

UI.TextArea.prototype.setValue = function ( value ) {

	this.dom.value = value;

	return this;

};


// Select

UI.Select = function () {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'select' );
	dom.className = 'Select';
	dom.style.padding = '2px';

	this.dom = dom;

	return this;

};

UI.Select.prototype = Object.create( UI.Element.prototype );
UI.Select.prototype.constructor = UI.Select;

UI.Select.prototype.setMultiple = function ( boolean ) {

	this.dom.multiple = boolean;

	return this;

};

UI.Select.prototype.setOptions = function ( options ) {

	var selected = this.dom.value;

	while ( this.dom.children.length > 0 ) {

		this.dom.removeChild( this.dom.firstChild );

	}

	for ( var key in options ) {

		var option = document.createElement( 'option' );
		option.value = key;
		option.innerHTML = options[ key ];
		this.dom.appendChild( option );

	}

	this.dom.value = selected;

	return this;

};

UI.Select.prototype.getValue = function () {

	return this.dom.value;

};

UI.Select.prototype.setValue = function ( value ) {

	value = String( value );

	if ( this.dom.value !== value ) {

		this.dom.value = value;

	}

	return this;

};

// FancySelect

UI.FancySelect = function () {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'div' );
	dom.className = 'FancySelect';
	dom.tabIndex = 0;	// keyup event is ignored without setting tabIndex

	// Broadcast for object selection after arrow navigation
	var changeEvent = document.createEvent('HTMLEvents');
	changeEvent.initEvent( 'change', true, true );

	// Prevent native scroll behavior
	dom.addEventListener( 'keydown', function (event) {

		switch ( event.keyCode ) {
			case 38: // up
			case 40: // down
				event.preventDefault();
				event.stopPropagation();
				break;
		}

	}, false);

	// Keybindings to support arrow navigation
	dom.addEventListener( 'keyup', function (event) {

		switch ( event.keyCode ) {
			case 38: // up
			case 40: // down
				scope.selectedIndex += ( event.keyCode == 38 ) ? -1 : 1;

				if ( scope.selectedIndex >= 0 && scope.selectedIndex < scope.options.length ) {

					// Highlight selected dom elem and scroll parent if needed
					scope.setValue( scope.options[ scope.selectedIndex ].value );

					scope.dom.dispatchEvent( changeEvent );

				}

				break;
		}

	}, false);

	this.dom = dom;

	this.options = [];
	this.selectedIndex = -1;
	this.selectedValue = null;

	return this;

};

UI.FancySelect.prototype = Object.create( UI.Element.prototype );
UI.FancySelect.prototype.constructor = UI.FancySelect;

UI.FancySelect.prototype.setOptions = function ( options ) {

	var scope = this;

	var changeEvent = document.createEvent( 'HTMLEvents' );
	changeEvent.initEvent( 'change', true, true );

	while ( scope.dom.children.length > 0 ) {

		scope.dom.removeChild( scope.dom.firstChild );

	}

	scope.options = [];

	for ( var i = 0; i < options.length; i ++ ) {

		var option = options[ i ];

		var div = document.createElement( 'div' );
		div.className = 'option';
		div.innerHTML = option.html;
		div.value = option.value;
		scope.dom.appendChild( div );

		scope.options.push( div );

		div.addEventListener( 'click', function ( event ) {

			scope.setValue( this.value );
			scope.dom.dispatchEvent( changeEvent );

		}, false );

	}

	return scope;

};

UI.FancySelect.prototype.getValue = function () {

	return this.selectedValue;

};

UI.FancySelect.prototype.setValue = function ( value ) {

	for ( var i = 0; i < this.options.length; i ++ ) {

		var element = this.options[ i ];

		if ( element.value === value ) {

			element.classList.add( 'active' );

			// scroll into view

			var y = element.offsetTop - this.dom.offsetTop;
			var bottomY = y + element.offsetHeight;
			var minScroll = bottomY - this.dom.offsetHeight;

			if ( this.dom.scrollTop > y ) {

				this.dom.scrollTop = y

			} else if ( this.dom.scrollTop < minScroll ) {

				this.dom.scrollTop = minScroll;

			}

			this.selectedIndex = i;

		} else {

			element.classList.remove( 'active' );

		}

	}

	this.selectedValue = value;

	return this;

};

// Label

UI.Label = function ( text ) {

	UI.Element.call( this );

	var dom = document.createElement( 'label' );
	dom.className = 'Label';

	this.dom = dom;
	this.setValue( text );

	return this;

};

UI.Label.prototype = Object.create( UI.Element.prototype );
UI.Label.prototype.constructor = UI.Label;

UI.Label.prototype.getValue = function () {

	return this.dom.textContent;

};

UI.Label.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		this.dom.textContent = value;

	}

	return this;

};

UI.Label.prototype.setFor = function ( value ) {

	if ( value !== undefined ) {

        this.dom.setAttribute('for', value);

	}

	return this;

};

// Radio

UI.Radio = function ( name  ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Radio';
	dom.type = 'radio';

	this.dom = dom;
	this.setValue( name );

	return this;

};

UI.Radio.prototype = Object.create( UI.Element.prototype );
UI.Radio.prototype.constructor = UI.Radio;

UI.Radio.prototype.getValue = function () {

	return this.dom.checked;

};

UI.Radio.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		this.dom.name = value;

	}

	return this;

};

UI.Radio.prototype.setCheck = function ( ) {

	//if ( value !== undefined ) {

        this.dom.setAttribute('checked', '');
		//this.dom.checked = '';

	//}

	return this;

};

// Checkbox

UI.Checkbox = function ( boolean ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Checkbox';
	dom.type = 'checkbox';

	this.dom = dom;
	this.setValue( boolean );

	return this;

};

UI.Checkbox.prototype = Object.create( UI.Element.prototype );
UI.Checkbox.prototype.constructor = UI.Checkbox;

UI.Checkbox.prototype.getValue = function () {

	return this.dom.checked;

};

UI.Checkbox.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		this.dom.checked = value;

	}

	return this;

};


// Color

UI.Color = function () {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Color';
	dom.style.width = '64px';
	dom.style.height = '16px';
	dom.style.border = '0px';
	dom.style.padding = '0px';
	dom.style.backgroundColor = 'transparent';

	try {

		dom.type = 'color';
		dom.value = '#ffffff';

	} catch ( exception ) {}

	this.dom = dom;

	return this;

};

UI.Color.prototype = Object.create( UI.Element.prototype );
UI.Color.prototype.constructor = UI.Color;

UI.Color.prototype.getValue = function () {

	return this.dom.value;

};

UI.Color.prototype.getHexValue = function () {

	return parseInt( this.dom.value.substr( 1 ), 16 );

};

UI.Color.prototype.setValue = function ( value ) {

	this.dom.value = value;

	return this;

};

UI.Color.prototype.setHexValue = function ( hex ) {

	this.dom.value = '#' + ( '000000' + hex.toString( 16 ) ).slice( -6 );

	return this;

};


// Number

UI.Number = function ( number ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Number';
	dom.value = '0.00';

	dom.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

		if ( event.keyCode === 13 ) dom.blur();

	}, false );

	this.min = - Infinity;
	this.max = Infinity;

	this.precision = 2;
	this.step = 1;

	this.dom = dom;
	this.setValue( number );

	var changeEvent = document.createEvent( 'HTMLEvents' );
	changeEvent.initEvent( 'change', true, true );

	var distance = 0;
	var onMouseDownValue = 0;

	var pointer = new THREE.Vector2();
	var prevPointer = new THREE.Vector2();

	var onMouseDown = function ( event ) {

		event.preventDefault();

		distance = 0;

		onMouseDownValue = parseFloat( dom.value );

		prevPointer.set( event.clientX, event.clientY );

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	};

	var onMouseMove = function ( event ) {

		var currentValue = dom.value;

		pointer.set( event.clientX, event.clientY );

		distance += ( pointer.x - prevPointer.x ) - ( pointer.y - prevPointer.y );

		var number = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;

		dom.value = Math.min( scope.max, Math.max( scope.min, number ) ).toFixed( scope.precision );

		if ( currentValue !== dom.value ) dom.dispatchEvent( changeEvent );

		prevPointer.set( event.clientX, event.clientY );

	};

	var onMouseUp = function ( event ) {

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		if ( Math.abs( distance ) < 2 ) {

			dom.focus();
			dom.select();

		}

	};

	var onChange = function ( event ) {

		var value = 0;

		try {

			value = eval( dom.value );

		} catch ( error ) {

			console.error( error.message );

		}

		dom.value = parseFloat( value );

	};

	var onFocus = function ( event ) {

		dom.style.backgroundColor = '';
		dom.style.borderColor = '#ccc';
		dom.style.cursor = '';

	};

	var onBlur = function ( event ) {

		dom.style.backgroundColor = 'transparent';
		dom.style.borderColor = 'transparent';
		dom.style.cursor = 'col-resize';

	};

	dom.addEventListener( 'mousedown', onMouseDown, false );
	dom.addEventListener( 'change', onChange, false );
	dom.addEventListener( 'focus', onFocus, false );
	dom.addEventListener( 'blur', onBlur, false );

	return this;

};

UI.Number.prototype = Object.create( UI.Element.prototype );
UI.Number.prototype.constructor = UI.Number;

UI.Number.prototype.getValue = function () {

	return parseFloat( this.dom.value );

};

UI.Number.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		this.dom.value = value.toFixed( this.precision );

	}

	return this;

};

UI.Number.prototype.setRange = function ( min, max ) {

	this.min = min;
	this.max = max;

	return this;

};

UI.Number.prototype.setPrecision = function ( precision ) {

	this.precision = precision;

	return this;

};


// Integer

UI.Integer = function ( number ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'input' );
	dom.className = 'Number';
	dom.value = '0.00';

	dom.addEventListener( 'keydown', function ( event ) {

		event.stopPropagation();

	}, false );

	this.min = - Infinity;
	this.max = Infinity;

	this.step = 1;

	this.dom = dom;
	this.setValue( number );

	var changeEvent = document.createEvent( 'HTMLEvents' );
	changeEvent.initEvent( 'change', true, true );

	var distance = 0;
	var onMouseDownValue = 0;

	var pointer = new THREE.Vector2();
	var prevPointer = new THREE.Vector2();

	var onMouseDown = function ( event ) {

		event.preventDefault();

		distance = 0;

		onMouseDownValue = parseFloat( dom.value );

		prevPointer.set( event.clientX, event.clientY );

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	};

	var onMouseMove = function ( event ) {

		var currentValue = dom.value;

		pointer.set( event.clientX, event.clientY );

		distance += ( pointer.x - prevPointer.x ) - ( pointer.y - prevPointer.y );

		var number = onMouseDownValue + ( distance / ( event.shiftKey ? 5 : 50 ) ) * scope.step;

		dom.value = Math.min( scope.max, Math.max( scope.min, number ) ) | 0;

		if ( currentValue !== dom.value ) dom.dispatchEvent( changeEvent );

		prevPointer.set( event.clientX, event.clientY );

	};

	var onMouseUp = function ( event ) {

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		if ( Math.abs( distance ) < 2 ) {

			dom.focus();
			dom.select();

		}

	};

	var onChange = function ( event ) {

		var value = 0;

		try {

			value = eval( dom.value );

		} catch ( error ) {

			console.error( error.message );

		}

		dom.value = parseInt( value );

	};

	var onFocus = function ( event ) {

		dom.style.backgroundColor = '';
		dom.style.borderColor = '#ccc';
		dom.style.cursor = '';

	};

	var onBlur = function ( event ) {

		dom.style.backgroundColor = 'transparent';
		dom.style.borderColor = 'transparent';
		dom.style.cursor = 'col-resize';

	};

	dom.addEventListener( 'mousedown', onMouseDown, false );
	dom.addEventListener( 'change', onChange, false );
	dom.addEventListener( 'focus', onFocus, false );
	dom.addEventListener( 'blur', onBlur, false );

	return this;

};

UI.Integer.prototype = Object.create( UI.Element.prototype );
UI.Integer.prototype.constructor = UI.Integer;

UI.Integer.prototype.getValue = function () {

	return parseInt( this.dom.value );

};

UI.Integer.prototype.setValue = function ( value ) {

	if ( value !== undefined ) {

		this.dom.value = value | 0;

	}

	return this;

};

UI.Integer.prototype.setRange = function ( min, max ) {

	this.min = min;
	this.max = max;

	return this;

};


// Break

UI.Break = function () {

	UI.Element.call( this );

	var dom = document.createElement( 'br' );
	dom.className = 'Break';

	this.dom = dom;

	return this;

};

UI.Break.prototype = Object.create( UI.Element.prototype );
UI.Break.prototype.constructor = UI.Break;


// HorizontalRule

UI.HorizontalRule = function () {

	UI.Element.call( this );

	var dom = document.createElement( 'hr' );
	dom.className = 'HorizontalRule';

	this.dom = dom;

	return this;

};

UI.HorizontalRule.prototype = Object.create( UI.Element.prototype );
UI.HorizontalRule.prototype.constructor = UI.HorizontalRule;


// Button

UI.Button = function ( value ) {

	UI.Element.call( this );

	var scope = this;

	var dom = document.createElement( 'button' );
	dom.className = 'Button';

	this.dom = dom;
	this.dom.textContent = value;

	return this;

};

UI.Button.prototype = Object.create( UI.Element.prototype );
UI.Button.prototype.constructor = UI.Button;

UI.Button.prototype.setLabel = function ( value ) {

	this.dom.textContent = value;

	return this;

};


// Dialog

UI.Dialog = function ( value ) {

	var scope = this;
	
	var dom = document.createElement( 'dialog' );

	if ( dom.showModal === undefined ) {

		// fallback

		dom = document.createElement( 'div' );
		dom.style.display = 'none';

		dom.showModal = function () {

			dom.style.position = 'absolute';
			dom.style.left = '100px';
			dom.style.top = '100px';
			dom.style.zIndex = 1;
			dom.style.display = '';

		};

	}

	dom.className = 'Dialog';

	this.dom = dom;

	return this;

};

UI.Dialog.prototype = Object.create( UI.Panel.prototype );
UI.Dialog.prototype.constructor = UI.Dialog;

UI.Dialog.prototype.showModal = function () {

	this.dom.showModal();

	return this;

};
