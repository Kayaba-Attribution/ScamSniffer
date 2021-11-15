const parser = require('@solidity-parser/parser');

const chalk = require('chalk');

module.exports = function run(ast) {
    const ret = {
        log: [],
        findings: []
    };
    parser.visit(ast, {
        FunctionDefinition(node, parentNode){

            // find mint functions declarations
            let mint_names = ['mint', '_mint', 'Mint'];
            if (mint_names.includes(node.name) && parentNode.kind == 'contract') {
                ret.findings.push(chalk.red(` [Mint Function] ${node.name}`));
            }

        }
    });

    return ret;
};