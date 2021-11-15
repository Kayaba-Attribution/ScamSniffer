const parser = require('@solidity-parser/parser');

const chalk = require('chalk');

module.exports = function run(ast) {
    const ret = {
        log: [],
        findings: []
    };
    parser.visit(ast, {
        FunctionDefinition(node, parentNode){

            try {
                let test = node.body.statements;
            } catch (e) {
                if (e.name != 'TypeError') {
                    console.log(`[ERROR] at no statements detections at ${node.name}`.red);
                }
                //console.log(`Using Contract as Interface ${node.name}`);
                return;
            }

            function checkExtraStatements(node_name, white_list, statements) {
                ret.log.push(chalk.italic.magenta(` Checking function ${node.name}`));
                for (let s of statements) {
                    if (!white_list.includes(s.type)) {
                        ret.findings.push(chalk.red(` [Extra Statement "${s.type}" on ${node_name}]`));
                    }
                }
            }
            
            // Check number of statements on transferFrom
            if (node.name == 'transferFrom' && parentNode.kind != 'interface') {
                //number_statements = Object.keys(node.body.statements).length;
                let transferFrom_white_list = ['ExpressionStatement', 'EmitStatement', 'ReturnStatement'];
                checkExtraStatements(node.name, transferFrom_white_list, node.body.statements);

            }

            // Check extra statements on _approve TODO: create modular function
            if (node.name == '_approve' && parentNode.kind != 'interface') {
                //number_statements = Object.keys(node.body.statements).length;
                let approve_white_list = ['ExpressionStatement', 'EmitStatement', 'ReturnStatement'];
                checkExtraStatements(node.name, approve_white_list, node.body.statements);

            }
        }
    });

    return ret;
};