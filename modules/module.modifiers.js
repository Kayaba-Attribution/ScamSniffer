const parser = require('@solidity-parser/parser');

const chalk = require('chalk');

module.exports = function run(ast) {
    const ret = {
        log: [],
        findings: []
    };
    let priv_functions = []
    parser.visit(ast, {
        FunctionDefinition(node, parentNode) {
            let modifiers = '';
            for (let m of node.modifiers) {
                if (modifiers) modifiers += ',';
                modifiers += m.name;
                ret.log.push([node.name, modifiers])
                if (modifiers === "onlyOwner")
                    priv_functions.push(node.name)
            }

        }
    });
    ret.log.push(` onlyOwner: [${priv_functions}]`)

    return ret;
};