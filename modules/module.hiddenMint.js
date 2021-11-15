const parser = require('@solidity-parser/parser');

const chalk = require('chalk');

module.exports = function run(ast) {
    const ret = {
        log: [],
        findings: []
    };
    parser.visit(ast, {
        FunctionDefinition(node, parentNode){

            // Search for Hidden Mints (+, and add()) on any function other that the whitelisted

            if (node.type == 'FunctionDefinition' && node.name != null && parentNode.kind == 'contract') {

                let sums = 0;
                let subs = 0;
                //console.log(node.name);

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
                                ret.log.push(` [Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and add()`.gray);
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
                                ret.log.push(` [Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '+'`.gray);
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
                                ret.log.push(` [Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '+='`.gray);
                                additions++;
                            }
                            //let isSum = (s.expression.right.operator == '+')
                        } catch (e) {
                            if (e.name != 'TypeError') {
                                console.log(`[ERROR] '+=' check at ${node.name}`.red, e);
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
                                ret.log.push(`[Subtraction in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and sub()`.gray);
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
                                ret.log.push(`[Subtraction in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '-'`.gray);
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
                                ret.log.push(`[Subtraction in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and '-='`.gray);
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
                    ret.findings.push(chalk.red(` [Hidden Mint] at "${node.name}" {${sums} sums | ${subs} subtractions}`));
                }
                if (sums < subs) {
                    ret.findings.push(chalk.red(` [Hidden Burn] at "${node.name}" {${sums} sums | ${subs} subtractions}`));
                }
                //console.log(`${sums} sums | ${subs} subtractions on ${node.name}`);

            }


        }

    });

    return ret;
};