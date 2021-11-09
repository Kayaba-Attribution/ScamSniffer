
const fs = require('fs');
const parser = require('@solidity-parser/parser');
const treeify = require('treeify');
const colors = require('colors');

function parse(file) {
    let node_kind;
    let alerts = [];
    const content = fs.readFileSync(file).toString('utf-8');
    const ast = (() => {
        try {
            return parser.parse(content);
        } catch (err) {
            console.log(`Error found while parsing the following file: ${file}`);
            throw err;
        }
    })();
    console.log(ast)

    console.log(treeify.asTree(ast, true));

    noColorOutput = false

    parser.visit(ast, {
        ContractDefinition(node) {

            const name = node.name;
            let bases = node.baseContracts.map(spec => {
                return spec.baseName.namePath;
            }).join(', ');

            bases = bases.length ?
                noColorOutput ?
                    `(${bases})`
                    : `(${bases})`.gray
                : '';

            let specs = '';
            if (node.kind === 'library') {
                specs += noColorOutput ? '[Lib]' : '[Lib]'.yellow;
            } else if (node.kind === 'interface') {
                specs += noColorOutput ? '[Int]' : '[Int]'.blue;
            }

            console.log(` + ${specs} ${name} ${bases}`);
            node_kind = node.kind;
        },

        'ContractDefinition:exit': function (node) {
            console.log('');
        },

        FunctionDefinition(node) {
            let name;

            if (node.isConstructor) {
                name = noColorOutput ? '<Constructor>' : '<Constructor>'.gray;
            } else if (node.isFallback) {
                name = noColorOutput ? '<Fallback>' : '<Fallback>'.gray;
            } else if (node.isReceiveEther) {
                name = noColorOutput ? '<Receive Ether>' : '<Receive Ether>'.gray;
            } else {
                name = node.name;
            }

            let spec = '';
            if (node.visibility === 'public' || node.visibility === 'default') {
                spec += noColorOutput ? '[Pub]' : '[Pub]'.green;
            } else if (node.visibility === 'external') {
                spec += noColorOutput ? '[Ext]' : '[Ext]'.blue;
            } else if (node.visibility === 'private') {
                spec += noColorOutput ? '[Prv]' : '[Prv]'.red;
            } else if (node.visibility === 'internal') {
                spec += noColorOutput ? '[Int]' : '[Int]'.gray;
            }

            let payable = '';
            if (node.stateMutability === 'payable') {
                payable = noColorOutput ? ' ($)' : ' ($)'.yellow;
            }

            let mutating = '';
            if (!node.stateMutability) {
                mutating = noColorOutput ? ' #' : ' #'.red;
            }

            let modifiers = ''
            for (let m of node.modifiers) {
                if (!!modifiers) modifiers += ','
                modifiers += m.name
            }


            function checkExtraStatements(node_name, white_list, statements) {
                for (let s of statements) {
                    if (!white_list.includes(s.type)) {
                        alerts.push(`[Extra Statement "${s.type}" on ${node_name}]`.red)
                    }
                }
            }

            // Check number of statements on transferFrom
            let transferFrom_statements = []
            if(node.name == 'transferFrom' && node_kind != 'interface') {
                //number_statements = Object.keys(node.body.statements).length;
                let transferFrom_white_list = ["ExpressionStatement", "EmitStatement", "ReturnStatement"]
                checkExtraStatements(node.name, transferFrom_white_list, node.body.statements)

            }

            // Check extra statements on _approve TODO: create modular function
            if (node.name == "_approve" && node_kind != 'interface') {
                //number_statements = Object.keys(node.body.statements).length;
                let approve_white_list = ["ExpressionStatement", "EmitStatement", "ReturnStatement"]
                checkExtraStatements(node.name, approve_white_list, node.body.statements)

            }

            // Check extra modifiers on _transfer TODO: create modular function
            if (node.name == "_transfer" && node_kind != 'interface') {
                for (let m of node.modifiers) {
                    if (!!modifiers) 
                    alerts.push(`[Extra Modifier "${m.name}" on _transfer]`.red)
                }
            }

            if (
                (
                    node.name == "mint"
                    || node.name == "_mint"
                ) && node_kind == 'contract') {
                alerts.push('[Mint Function]'.red)
            }

            // Search for Hidden Mints (+, and add()) on any function other that the whitelisted

            if (node.type == 'FunctionDefinition' && node.name != null && node_kind == 'contract'){

                let add_functions_whitelist = [
                    '_transfer',
                    '_transferFrom',
                    "_approve",
                    "mint",
                    "_mint",
                    "lock",
                    "deliver",
                    "_transferBothExcluded",
                    "_reflectFee",
                    "_takeLiquidity",
                    "_transferStandard",
                    "_transferToExcluded",
                    "_transferFromExcluded"
                ]

                if (!add_functions_whitelist.includes(node.name)) {
                    for (let s of node.body.statements) {

                        // Search statements of the node for a 'add' operator

                        try {
                            let add_search_left = s.expression.left.expression.memberName
                            if (add_search_left == 'add') {
                                alerts.push(`[Hidden Mint at "${node.name}" '.add']`.red)
                            }
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] ${e.name} at hidden mint finder`)
                            }
                        }

                        try {
                            let add_search_rigth = s.expression.right.expression.memberName
                            if (add_search_rigth == 'add') {
                                alerts.push(`[Hidden Mint at "${node.name}" '.add']`.red)
                            }
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] ${e.name} at hidden mint finder`)
                            }
                        }

                        // Search statements of the node for a '+' operator

                        try {
                            let plus_search_rigth = s.expression.right.operator
                            if (plus_search_rigth == '+') {
                                alerts.push(`[Hidden Mint at "${node.name}" '+']`.red)
                            }
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] ${e.name} at hidden mint finder`)
                            }
                        }

                        try {
                            let plus_search_rigth = s.expression.right.operator
                            if (plus_search_rigth == '+') {
                                alerts.push(`[Hidden Mint at "${node.name}" '+']`.red)
                            }
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] ${e.name} at hidden mint finder`)
                            }
                        }

                    }
                }



            }

            console.log(`    - ${spec} ${name}${payable}${mutating}`)
            if (!!modifiers) {
                console.log(`       - modifiers: ${modifiers}`)
            }
        }
    });

    // Print a legend for symbols being used
    let mutationSymbol = noColorOutput ? ' #' : ' #'.red;
    let payableSymbol = noColorOutput ? ' ($)' : ' ($)'.yellow;
    let alertSymbol = noColorOutput ? ' (!!!)' : ' (!!!)'.red;
    console.log(`${alertSymbol} Findings${alertSymbol}`)
    for(var a in alerts){
        console.log('       ',alerts[a])
    }

        console.log(`
    ${payableSymbol} = payable function
    ${mutationSymbol} = non-constant function
    `);

    
}

let x = String()
//parse('safemoon.sol');
//parse('lol.sol');
//parse('noap.sol');
//parse('newunHoneypot.sol'); //GreenDildoToken https://bscscan.com/address/0xac92cffe2e97627db3edcdc22cf6eca6d1fdac83#code
//parse('fakemod.sol'); //NanoDoge https://bscscan.com/address/0x2a149c74393ff4b4d08bcbb554993ad64a3ccff0

//parse('mint.sol');

//1. Search for _totalSupply variable - if there is an addition to _totalSupply there might be a mint function.

//2. Check if there is a function that increases someone’s balance without decreasing someone else’s balance.

parse('contracts/test.sol');


