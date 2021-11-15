
const fs = require('fs');
const parser = require('@solidity-parser/parser');
const treeify = require('treeify');
const colors = require('colors');
const { performance } = require('perf_hooks');

function parse(file) {
    var start = performance.now();
    let node_kind;
    let alerts = [];
    let info = []
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

    noColorOutput = false;
    let uses_totalSupply = false;

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

        StateVariableDeclaration(node){
            //find _totalSupply declaration probably can be done better
            if(node_kind == 'contract'){
                try{
                    for (let v of node.variables) {

                        if (v.name == '_totalSupply') {
                            uses_totalSupply = true
                            console.log("using total supply")
                            console.log(`Uses uint256 _totalSupply: ${uses_totalSupply}`.green)
                        }else{
                           
                        }
                        
                    }
                }catch(e){
                    console.log(e)
                }
            }
            
   
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

            try {
                let test = node.body.statements;
            } catch (e) {
                if (e.name != 'TypeError') {
                    console.log(`[ERROR] at no statemetns detections at ${node.name}`.red)
                }
                console.log(`Using Contract as Interface ${node.name}`)
                return
            }

            // search for totalSupply getter. to be removed, is useless
            if (node.name == 'totalSupply' && node_kind== 'contract'){
                for (let s of node.body.statements){
                    if (!(s.expression.name == '_totalSupply')){
                        alerts.push(`[Not using _totalSupply" possible hidden mint`.red)
                    }
                    else{
                        has_totalSupply = true
                        console.log(`Uses _totalSupply: ${has_totalSupply}`.green)
                    }
                }
            }

            // check the statements on a function vs a whitelist if not in it then alert is sent
            function checkExtraStatements(node_name, white_list, statements) {
                for (let s of statements) {
                    if (!white_list.includes(s.type)) {
                        alerts.push(`[Extra Statement "${s.type}" on ${node_name}]`.red)
                    }
                }
            }

            // Check number of statements on transferFrom
            if (node.name == 'transferFrom' && node_kind != 'interface') {
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

            // find mint functions declarations
            let mint_names = ["mint", "_mint", "Mint"]
            if (mint_names.includes(node.name) && node_kind == 'contract') {
                alerts.push(`[Mint Function] ${node.name}`.red)
            }

            // Search for Hidden Mints (+, and add()) on any function other that the whitelisted

            if (node.type == 'FunctionDefinition' && node.name != null && node_kind == 'contract') {

                let sums = 0;
                let subs = 0;
                console.log(node.name)

                for (let s of node.body.statements) {

                    // Search statements of the node for a 'add' operator
                    let isIndexAccess = '';
                    let indexedBase = '';
                    let indexedindex = '';

                    try{
                        //Check left for IndexAccess
                        isIndexAccess = (s.expression.left.type == 'IndexAccess') ? true : false;
                        indexedBase = s.expression.left.base.name;
                        indexedindex = s.expression.left.index.name;
                        if (indexedindex == undefined) { indexedindex = s.expression.left.index.type}

                        sums += checkForAddition(isIndexAccess, indexedBase, indexedindex)
                        subs += checkForSubtraction(isIndexAccess, indexedBase, indexedindex)

                    } catch (e) {
                        if (e.name != 'TypeError') {
                            console.log(`[ERROR] Left IndexAccesCheck at ${node.name}`.red)
                        }
                    }

                    function checkForAddition(isIndexAccess, indexedBase, indexedindex) {

                        let additions = 0;
                        try {
                            //Check right for add
                            let isAdd = (s.expression.right.expression.memberName == 'add') ? true : false;
                            if (isIndexAccess && isAdd) {
                                info.push(`[Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and add()`.gray)
                                additions++
                            }
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] Add() check at ${node.name}`.red)
                            }
                        }

                        try {
                            //Check right for operator +
                            let isSum = (s.expression.right.operator == '+') ? true : false;
                            if (isIndexAccess && isSum) {
                                info.push(`[Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '+'`.gray)
                                additions++
                            }
                            //let isSum = (s.expression.right.operator == '+')
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] '+' check at ${node.name}`.red)
                            }
                        }

                        try {
                            //Check sum and var update +=
                            let isSumUpdate = (s.expression.operator == '+=') ? true : false;
                            if (isIndexAccess && isSumUpdate) {
                                info.push(`[Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '+='`.gray)
                                additions++
                            }
                            //let isSum = (s.expression.right.operator == '+')
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] '+=' check at ${node.name}`.red)
                            }
                        }

                        return additions
                    }


                    function checkForSubtraction(isIndexAccess, indexedBase, indexedindex) {
                        let substractions = 0;
                        try {
                            //Check right for sub
                            let isSub = (s.expression.right.expression.memberName == 'sub') ? true : false;
                            if (isIndexAccess && isSub) {
                                info.push(`[Subtraction in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and sub()`.gray)
                                substractions++
                            }
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] sub() check at ${node.name}`.red)
                            }
                        }

                        try {
                            //Check right for operator +
                            let isMinus = (s.expression.right.operator == '-') ? true : false;
                            if (isIndexAccess && isMinus) {
                                info.push(`[Subtraction in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '-'`.gray)
                                substractions++
                            }
                            //let isSum = (s.expression.right.operator == '+')
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] '-' check at ${node.name}`.red)
                            }
                        }

                        try {
                            //Check sum and var update +=
                            let isMinusUpdate = (s.expression.operator == '-=') ? true : false;
                            if (isIndexAccess && isMinusUpdate) {
                                info.push(`[Subtraction in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '-='`.gray)
                                substractions++
                            }
                            //let isSum = (s.expression.right.operator == '+')
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] '-=' check at ${node.name}`.red)
                            }
                        }
                        return substractions
                    }
                    


                }
                if(sums > subs){
                    alerts.push(`[Hidden Mint] at "${node.name}" {${sums} sums | ${subs} subtractions}`.red)
                }
                if (sums < subs) {
                    alerts.push(`[Hidden Burn] at "${node.name}" {${sums} sums | ${subs} subtractions}`.red)
                }
                //console.log(`${sums} sums | ${subs} subtractions on ${node.name}`)

            }

            console.log(`    - ${spec} ${name}${payable}${mutating}`)
            if (!!modifiers) {
                console.log(`       - modifiers: ${modifiers}`)
            }
        }
    });

    if (!uses_totalSupply) {
        alerts.push(`[Possible Hidden Mint] Not using _totalSupply variable`.red)
    }

    // Print a legend for symbols being used
    let mutationSymbol = noColorOutput ? ' #' : ' #'.red;
    let payableSymbol = noColorOutput ? ' ($)' : ' ($)'.yellow;
    let alertSymbol = noColorOutput ? ' (!!!)' : ' (!!!)'.brightRed;
    let infoSymbol = noColorOutput ? ' (???)' : ' (???)'.gray;
    console.log(`${alertSymbol} Findings${alertSymbol}\n`)
    for (var a in alerts) {
        console.log('       ', alerts[a])
    }

    console.log(`\n${infoSymbol} Info${infoSymbol}\n`)


    for (var i in info) {
        console.log('       ', info[i])
    }

    console.log(`
    ${payableSymbol} = payable function
    ${mutationSymbol} = non-constant function
    `);
    var end = performance.now();
    console.log('Run Time ' + (end - start) + ' ms.');
}


parse('contracts/test.sol');
//parse('contracts/ERC20.sol');

