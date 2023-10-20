import { REVISION } from 'three';
import * as Nodes from 'three/nodes';

const opLib = {
	'=': 'assign',
	'+': 'add',
	'-': 'sub',
	'*': 'mul',
	'/': 'div',
	'%': 'remainder',
	'<': 'lessThan',
	'>': 'greaterThan',
	'<=': 'lessThanEqual',
	'>=': 'greaterThanEqual',
	'==': 'equal',
	'&&': 'and',
	'||': 'or',
	'^^': 'xor',
	'&': 'bitAnd',
	'|': 'bitOr',
	'^': 'bitXor',
	'<<': 'shiftLeft',
	'>>': 'shiftRight',
	'+=': 'addAssign',
	'-=': 'subAssign',
	'*=': 'mulAssign',
	'/=': 'divAssign',
	'%=': 'remainderAssign',
	'^=': 'xorAssign',
	'&=': 'bitAndAssign',
	'|=': 'bitOrAssign',
	'<<=': 'shiftLeftAssign',
	'>>=': 'shiftRightAssign'
};

const unaryLib = {
	'+': '', // positive
	'-': 'negate',
	'~': 'bitNot',
	'!': 'not',
	'++': 'increment', // incrementBefore
	'--': 'decrement' // decrementBefore
};

const isPrimitive = ( value ) => /^(true|false|-?\d)/.test( value );

class TSLEncoder {

	constructor() {

		this.tab = '';
		this.imports = new Set();
		this.functions = new Set();
		this.layoutsCode = '';

	}

	addImport( name ) {

		// import only if it's a node

		name = name.split( '.' )[ 0 ];

		if ( Nodes[ name ] !== undefined && this.functions.has( name ) === false ) {

			this.imports.add( name );

		}

	}

	emitExpression( node ) {

		let code;

		if ( node.isAccessor ) {

			this.addImport( node.property );

			code = node.property;

		} else if ( node.isNumber ) {

			if ( node.type === 'int' || node.type === 'uint' ) {

				code = node.type + '( ' + node.value + ' )';

				this.addImport( node.type );

			} else {

				code = node.value;

			}

		} else if ( node.isOperator ) {

			const opFn = opLib[ node.type ] || node.type;

			const left = this.emitExpression( node.left );
			const right = this.emitExpression( node.right );

			if ( isPrimitive( left ) && isPrimitive( right ) ) {

				return left + ' ' + node.type + ' ' + right;

			}

			if ( isPrimitive( left ) ) {

				code = opFn + '( ' + left + ', ' + right + ' )';

			} else {

				code = left + '.' + opFn + '( ' + right + ' )';

			}

			this.addImport( opFn );

		} else if ( node.isFunctionCall ) {

			const params = [];

			for ( const parameter of node.params ) {

				params.push( this.emitExpression( parameter ) );

			}

			this.addImport( node.name );

			const paramsStr = params.length > 0 ? ' ' + params.join( ', ' ) + ' ' : '';

			code = `${ node.name }(${ paramsStr })`;

		} else if ( node.isReturn ) {

			code = 'return';

			if ( node.value ) {

				code += ' ' + this.emitExpression( node.value );

			}

		} else if ( node.isAccessorElements ) {

			code = node.property;

			for ( const element of node.elements ) {

				if ( element.isStaticElement ) {

					code += '.' + this.emitExpression( element.value );

				} else if ( element.isDynamicElement ) {

					const value = this.emitExpression( element.value );

					if ( isPrimitive( value ) ) {

						code += `[ ${ value } ]`;

					} else {

						code += `.element( ${ value } )`;

					}

				}

			}

		} else if ( node.isDynamicElement ) {

			code = this.emitExpression( node.value );

		} else if ( node.isStaticElement ) {

			code = this.emitExpression( node.value );

		} else if ( node.isFor ) {

			code = this.emitFor( node );

		} else if ( node.isVariableDeclaration ) {

			code = this.emitVariables( node );

		} else if ( node.isTernary ) {

			code = this.emitTernary( node );

		} else if ( node.isConditional ) {

			code = this.emitConditional( node );

		} else if ( node.isUnary && node.expression.isNumber ) {

			code = node.type + node.expression.value;

		} else if ( node.isUnary ) {

			let type = unaryLib[ node.type ];

			this.addImport( type );

			if ( node.after === false && ( node.type === '++' || node.type === '--' ) ) {

				type += 'Before';

			}

			code = type + '( ' + this.emitExpression( node.expression ) + ' )';

		} else {

			console.error( 'Unknown node type', node );

		}

		if ( ! code ) code = '/* unknown statement */';

		return code;

	}

	emitBody( body ) {

		const lines = [];

		this.tab += '\t';

		for ( const statement of body ) {

			let code = this.emitExpression( statement );

			if ( statement.isConditional ) {

				code = '\n' + this.tab + code + ';';

				if ( statement !== body[ body.length - 1 ] ) {

					code += '\n';

				}

			} else if ( statement.isFor ) {

				code = '\n' + this.tab + code + '\n';

			} else {

				code = this.tab + code + ';';

			}

			lines.push( code );

		}

		this.tab = this.tab.slice( 0, - 1 );

		return lines.join( '\n' );


	}

	emitTernary( node ) {

		const condStr = this.emitExpression( node.cond );
		const leftStr = this.emitExpression( node.left );
		const rightStr = this.emitExpression( node.right );

		this.addImport( 'cond' );

		return `cond( ${ condStr }, ${ leftStr }, ${ rightStr } )`;

	}

	emitConditional( node ) {

		const condStr = this.emitExpression( node.cond );
		const bodyStr = this.emitBody( node.body );

		let ifStr = `If( ${ condStr }, () => {

${ bodyStr } 

${ this.tab }} )`;

		let current = node;

		while ( current.elseConditional ) {

			const elseBodyStr = this.emitBody( current.elseConditional.body );

			if ( current.elseConditional.cond ) {

				const elseCondStr = this.emitExpression( current.elseConditional.cond );

				ifStr += `.elseif( ( ${ elseCondStr } ) => {

${ elseBodyStr }

${ this.tab }} )`;

			} else {

				ifStr += `.else( () => {

${ elseBodyStr }

${ this.tab }} )`;

			}

			current = current.elseConditional;


		}

		this.imports.add( 'If' );

		return ifStr;

	}

	emitLoop( node ) {

		const start = this.emitExpression( node.initialization.value );
		const end = this.emitExpression( node.condition.right );

		const name = node.initialization.name;
		const type = node.initialization.type;
		const condition = node.condition.type;
		const update = node.afterthought.type;

		const nameParam = name !== 'i' ? `, name: '${ name }'` : '';
		const typeParam = type !== 'int' ? `, type: '${ type }'` : '';
		const conditionParam = condition !== '<' ? `, condition: '${ condition }'` : '';
		const updateParam = update !== '++' ? `, update: '${ update }'` : '';

		let loopStr = `loop( { start: ${ start }, end: ${ end + nameParam + typeParam + conditionParam + updateParam } }, ( { ${ name } } ) => {\n\n`;

		loopStr += this.emitBody( node.body ) + '\n\n';

		loopStr += this.tab + '} );\n\n';

		this.imports.add( 'loop' );

		return loopStr;

	}

	emitFor( node ) {

		const { initialization, condition, afterthought } = node;

		if ( ( initialization && initialization.isVariableDeclaration && initialization.next === null ) &&
			( condition && condition.left.isAccessor && condition.left.property === initialization.name ) &&
			( afterthought && afterthought.isUnary ) &&
			( initialization.name === condition.left.property ) &&
			( initialization.name === afterthought.expression.property )
		) {

			return this.emitLoop( node );

		}

		return this.emitForWhile( node );

	}

	emitForWhile( node ) {

		const initialization = this.emitExpression( node.initialization );
		const condition = this.emitExpression( node.condition );
		const afterthought = this.emitExpression( node.afterthought );

		this.tab += '\t';

		let forStr = '{\n\n' + this.tab + initialization + ';\n\n';
		forStr += `${ this.tab }While( ${ condition }, () => {\n\n`;

		forStr += this.emitBody( node.body ) + '\n\n';

		forStr += this.tab + '\t' + afterthought + ';\n\n';

		forStr += this.tab + '} );\n\n';

		this.tab = this.tab.slice( 0, - 1 );

		forStr += this.tab + '}';

		this.imports.add( 'While' );

		return forStr;

	}

	emitVariables( node, isRoot = true ) {

		const { name, type, value, next } = node;

		const valueStr = value ? this.emitExpression( value ) : '';

		let varStr = isRoot ? 'const ' : '';
		varStr += name;

		if ( value ) {

			if ( value.isFunctionCall && value.name === type ) {

				varStr += ' = ' + valueStr;

			} else {

				varStr += ` = ${ type }( ${ valueStr } )`;

			}

		} else {

			varStr += ` = ${ type }()`;

		}

		if ( node.isConst === false ) {

			varStr += '.toVar()';

		}

		if ( next ) {

			varStr += ', ' + this.emitVariables( next, false );

		}

		this.addImport( type );

		return varStr;

	}

	emitFunction( node ) {

		const { name, type } = node;

		const params = [];
		const inputs = [];

		let hasPointer = false;

		for ( const param of node.params ) {

			let str = `{ name: '${ param.name }', type: '${ param.type }'`;

			if ( param.qualifier ) {

				if ( param.qualifier === 'inout' || param.qualifier === 'out' ) {

					hasPointer = true;

				}

				str += ', qualifier: \'' + param.qualifier + '\'';

			}

			inputs.push( str + ' }' );
			params.push( param.name );

		}

		const paramsStr = params.length > 0 ? ' [ ' + params.join( ', ' ) + ' ] ' : '';
		const bodyStr = this.emitBody( node.body );

		const funcStr = `\nconst ${ name } = tslFn( (${ paramsStr }) => {

${ bodyStr }

} );\n`;

		const layoutInput = inputs.length > 0 ? '\n\t\t' + inputs.join( ',\n\t\t' ) + '\n\t' : '';

		if ( node.layout !== false && hasPointer === false ) {

			this.layoutsCode += `${ name }.setLayout( {
	name: '${ name }',
	type: '${ type }',
	inputs: [${ layoutInput }]
} );\n\n`;

		}

		this.imports.add( 'tslFn' );

		this.functions.add( node.name );

		return funcStr;

	}

	emit( ast ) {

		let code = '';

		for ( const statement of ast.body ) {

			if ( statement.isFunctionDeclaration ) {

				code += this.emitFunction( statement );

			} else {

				code += this.emitExpression( statement ) + ';\n';

			}

		}

		const imports = [ ...this.imports ];
		const functions = [ ...this.functions ];

		const header = '// Three.js Transpiler r' + REVISION + '\n\n';
		const importStr = imports.length > 0 ? 'import { ' + imports.join( ', ' ) + ' } from \'three/nodes\';\n\n' : '';
		const functionsStr = functions.length > 0 ? '\nexport { ' + functions.join( ', ' ) + ' };\n' : '';

		const layouts = this.layoutsCode.length > 0 ? '\n// layouts\n\n' + this.layoutsCode : '';

		return header + importStr + code + functionsStr + layouts;

	}

}

export default TSLEncoder;
