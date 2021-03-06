const args = require('args');
const fs = require('fs');
const parser = require('@solidity-parser/parser');
const treeify = require('treeify');
const colors = require('colors');
const { performance } = require('perf_hooks');
require('dotenv').config();
const axios = require('axios');
const web3 = require('web3')


const normalizedPath = require('path').join(__dirname, 'modules');

const modules = fs.readdirSync(normalizedPath).reduce(function(els, file) {
    els[file] = require('./modules/' + file);
    return els;
}, {});

function parse(content) {
    var start = performance.now();
    let alerts = [];
    let info = [];
    let modifiers_arr = []
    const ast = parser.parse(content);


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
            report.findings.forEach(e => {console.log(sep + e); alerts.push(e)});
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
                //modifiers_arr.push([node.name, modifiers])
            }


            // Check extra modifiers on _transfer TODO: create modular function
            if (node.name == '_transfer' && parentNode.kind != 'interface') {
                for (let m of node.modifiers) {
                    if (modifiers)
                        alerts.push(`[Extra Modifier "${m.name}" on _transfer]`.red);
                }
            }
            //
            // console.log(`    - ${spec} ${name}${payable}${mutating}`);
            // if (modifiers) {
            //     console.log(`       - modifiers: ${modifiers}`);
            // }
            //console.log(modifiers_arr)
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
    return alerts
}



async function FetchCode(address) {
    let callABI = "https://api.bscscan.com/api?module=contract&action=getsourcecode&address=" + address + "&apikey="+ process.env.BSC_API_KEY +".json"
    const response = await axios.get(callABI)
    //console.log(response)
    //console.log(callABI)

    return response.data.result[0].SourceCode
}


async function ParseWeb(address) {

    let chain = '';
    let code = '';
    let alerts = [];

    console.log("Address:", address);

    if(!web3.utils.isAddress(address)){
        console.log("Address is not a valid ETH address")
        process.exit(1);
    }

    let call_promise = FetchCode(address)
    // this gave me headaches
    await call_promise.then(result => {
        if(result == ""){
            console.log(`Contract ${address} on ${chain} is not verified`)
        }else{
            code = result;
            alerts = parse(result);
        }
    });

    return alerts
}

// Entry Point 

let alert_pkg = ParseWeb('0x8076c74c5e3f5852037f31ff0093eeb8c8add8d3')
alert_pkg.then(result => {
    console.log("FINISHED!")
    // for (var a in result) {
    //     console.log(result[a]);
    // }
});
