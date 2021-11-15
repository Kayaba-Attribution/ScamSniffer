const parser = require('@solidity-parser/parser');

const chalk = require('chalk');


module.exports = function run(ast) {
    const ret = {
        log: [],
        findings: []
    };
    parser.visit(ast, {
        ContractDefinition(node) {
            const name = node.name;
            let bases = node.baseContracts.map(spec => {
                return spec.baseName.namePath;
            }).join(', ');

            bases = bases.length ?
                chalk.gray(bases)
                : '';

            let specs = '';
            if (node.kind === 'library') {
                specs += chalk.yellow('[Lib]');
            } else if (node.kind === 'interface') {
                specs += chalk.blue('[Int]');
            }

            ret.log.push(` + ${specs} ${name} ${bases}`);
        }
    });

    return ret;
};