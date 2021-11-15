const args = require('args');
const fs = require('fs');
const parser = require('@solidity-parser/parser');
const treeify = require('treeify');
const colors = require('colors');
const { performance } = require('perf_hooks');

const normalizedPath = require('path').join(__dirname, 'modules');

const modules = fs.readdirSync(normalizedPath).reduce(function(els, file) {
    els[file] = require('./modules/' + file);
    return els;
}, {});

function parse(content, printast = false, printTree = false) {
    var start = performance.now();
    let alerts = [];
    let info = [];
    const ast = parser.parse(content);

    if(printast) {
        console.log(ast);
    }

    if(printTree){
        console.log(treeify.asTree(ast, true));
    }

    console.log(`
   / \__            _______________     .  '  *    .  . ' .  '  ___  __    _   __  __ 
  (    @\____  |==c(___(o(______(_()         .  *  *  -+-  *   / __|/ __| /_\\ |  \\/  |
  /         O      /|\\               .    * .    '  *  .      \\__ \\ (__ / _ \\| |\\/| |
 /   (_____/      / | \\                   * .  ' .  .  *  '   |___/\\___/_/ \\_\\_|  |_|
/_____/          /  |  \\                -+-    *  .   '  . *
« Scam Sniffer v0.1.0 »    `)

    const noColorOutput = false;

    Object.keys(modules).forEach(m => {
        let title = '║ running module '+ m + " ║"
        console.log(`╔${'═'.repeat(title.length - 2)}╗`);
        console.log(title);
        console.log(`╠${'═'.repeat(title.length - 2)}╝`);
        const report = modules[m](ast);

        let sep = `║ ╠══`

        if (report.log && report.log.length) {
            console.log('╠═╦═ LOGS');
            report.log.forEach(e => console.log(sep + e));
        }
        if (report.findings && report.findings.length) {
            console.log('╠═╦═ Findings:');
            report.findings.forEach(e => console.log(sep + e));
        }
    });

    parser.visit(ast, {
        

        FunctionDefinition(node, parentNode) {
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

            let modifiers = '';
            for (let m of node.modifiers) {
                if (modifiers) modifiers += ',';
                modifiers += m.name;
            }


            // Check extra modifiers on _transfer TODO: create modular function
            if (node.name == '_transfer' && parentNode.kind != 'interface') {
                for (let m of node.modifiers) {
                    if (modifiers)
                        alerts.push(`[Extra Modifier "${m.name}" on _transfer]`.red);
                }
            }

            // Search for Hidden Mints (+, and add()) on any function other that the whitelisted

            if (node.type == 'FunctionDefinition' && node.name != null && parentNode.kind == 'contract') {

                let sums = 0;
                let subs = 0;
                console.log(node.name);

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
                        if (indexedindex == undefined) { indexedindex = s.expression.left.index.type;}

                        sums += checkForAddition(isIndexAccess, indexedBase, indexedindex);
                        subs += checkForSubtraction(isIndexAccess, indexedBase, indexedindex);

                    } catch (e) {
                        if (e.name != 'TypeError') {
                            console.log(`[ERROR] Left IndexAccesCheck at ${node.name}`.red);
                        }
                    }

                    function checkForAddition(isIndexAccess, indexedBase, indexedindex) {

                        let additions = 0;
                        try {
                            //Check right for add
                            let isAdd = (s.expression.right.expression.memberName == 'add') ? true : false;
                            if (isIndexAccess && isAdd) {
                                info.push(`[Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and add()`.gray);
                                additions++;
                            }
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] Add() check at ${node.name}`.red);
                            }
                        }

                        try {
                            //Check right for operator +
                            let isSum = (s.expression.right.operator == '+') ? true : false;
                            if (isIndexAccess && isSum) {
                                info.push(`[Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '+'`.gray);
                                additions++;
                            }
                            //let isSum = (s.expression.right.operator == '+')
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] '+' check at ${node.name}`.red);
                            }
                        }

                        try {
                            //Check sum and var update +=
                            let isSumUpdate = (s.expression.operator == '+=') ? true : false;
                            if (isIndexAccess && isSumUpdate) {
                                info.push(`[Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '+='`.gray);
                                additions++;
                            }
                            //let isSum = (s.expression.right.operator == '+')
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] '+=' check at ${node.name}`.red);
                            }
                        }

                        return additions;
                    }


                    function checkForSubtraction(isIndexAccess, indexedBase, indexedindex) {
                        let substractions = 0;
                        try {
                            //Check right for sub
                            let isSub = (s.expression.right.expression.memberName == 'sub') ? true : false;
                            if (isIndexAccess && isSub) {
                                info.push(`[Subtraction in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and sub()`.gray);
                                substractions++;
                            }
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] sub() check at ${node.name}`.red);
                            }
                        }

                        try {
                            //Check right for operator +
                            let isMinus = (s.expression.right.operator == '-') ? true : false;
                            if (isIndexAccess && isMinus) {
                                info.push(`[Subtraction in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '-'`.gray);
                                substractions++;
                            }
                            //let isSum = (s.expression.right.operator == '+')
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] '-' check at ${node.name}`.red);
                            }
                        }

                        try {
                            //Check sum and var update +=
                            let isMinusUpdate = (s.expression.operator == '-=') ? true : false;
                            if (isIndexAccess && isMinusUpdate) {
                                info.push(`[Subtraction in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '-='`.gray);
                                substractions++;
                            }
                            //let isSum = (s.expression.right.operator == '+')
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] '-=' check at ${node.name}`.red);
                            }
                        }
                        return substractions;
                    }
                    


                }
                if(sums > subs){
                    alerts.push(`[Hidden Mint] at "${node.name}" {${sums} sums | ${subs} subtractions}`.red);
                }
                if (sums < subs) {
                    alerts.push(`[Hidden Burn] at "${node.name}" {${sums} sums | ${subs} subtractions}`.red);
                }
                //console.log(`${sums} sums | ${subs} subtractions on ${node.name}`);

            }

            console.log(`    - ${spec} ${name}${payable}${mutating}`);
            if (modifiers) {
                console.log(`       - modifiers: ${modifiers}`);
            }
        }
    });

   

    // Print a legend for symbols being used
    let mutationSymbol = noColorOutput ? ' #' : ' #'.red;
    let payableSymbol = noColorOutput ? ' ($)' : ' ($)'.yellow;
    let alertSymbol = noColorOutput ? ' (!!!)' : ' (!!!)'.brightRed;
    let infoSymbol = noColorOutput ? ' (???)' : ' (???)'.gray;
    console.log(`${alertSymbol} Findings${alertSymbol}\n`);
    for (var a in alerts) {
        console.log('       ', alerts[a]);
    }

    console.log(`\n${infoSymbol} Info${infoSymbol}\n`);


    for (var i in info) {
        console.log('       ', info[i]);
    }

    console.log(`
    ${payableSymbol} = payable function
    ${mutationSymbol} = non-constant function
    `);
    var end = performance.now();
    console.log('Run Time ' + (end - start) + ' ms.');
}


 
args
    .option('ast', 'Print AST')
    .option('tree', 'Print tree')
    .option('file', 'File to scan', ['f']);
//'contracts/test.sol'
  
  
const flags = args.parse(process.argv);
const file = flags.file[0];
if(file === 'f' ){
    console.log('add flag -f file.sol');
    process.exit(1);
}
if (!fs.existsSync(file)) {
    console.log(file);
    console.error('File not found');
    process.exit(1);
}
  
const content = fs.readFileSync(file).toString('utf-8');

parse(content, flags.ast, flags.tree);

