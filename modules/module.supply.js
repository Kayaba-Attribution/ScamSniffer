const parser = require('@solidity-parser/parser');

const chalk = require('chalk');


module.exports = function run(ast) {
    const ret = {
        log: [],
        findings: []
    };
    let uses_totalSupply = false;
    let has_totalSupply = false;

    parser.visit(ast, {
        StateVariableDeclaration(node, parentNode){
            // find _totalSupply declaration probably can be done better
            if(parentNode.kind == 'contract'){
                for (let v of node.variables) {
                    if (v.name == '_totalSupply') {
                        uses_totalSupply = true;
                        break;
                    }                        
                }
            }
        },
        FunctionDefinition(node, parentNode) {
            // search for totalSupply getter. to be removed, is useless
            if (node.name == 'totalSupply' && parentNode.kind== 'contract'){
                for (let s of node.body.statements){
                    if (s.expression.name == '_totalSupply'){
                        has_totalSupply = true;
                        break;
                    }
                }
            }
        }
    });

    if(uses_totalSupply) {
        ret.log.push(chalk.green(' Uses uint256 _totalSupply'));
    } else {
        ret.findings.push(chalk.red(' [Not using uint256 _totalSupply] possible hidden mint'));
    }

    if(has_totalSupply) {
        ret.log.push(chalk.green(' Uses totalSupply getter'));
    } else {
        ret.findings.push(chalk.red(' [Not using totalSupply getter] possible hidden mint'));
    }
    return ret;
};