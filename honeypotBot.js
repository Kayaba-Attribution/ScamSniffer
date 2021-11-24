
const Web3 = require('web3')

module.exports =  async function (address) {
    web3 = new Web3('https://speedy-nodes-nyc.moralis.io/aaf5f27c6c7a9ad182a69ccd/bsc/mainnet');

    let bnbIN = 1000000000000000000;
    let result = []
    let warnings = [];
    let status = ''
    let buy_tax = '--'
    let sell_tax = '--'

    // address is 0x5e9280d53f28281ce098c8f64e49f5f5dc9ea185
    let encodedAddress = web3.eth.abi.encodeParameter('address', address);
    // encoded address 0x0000000000000000000000005e9280d53f28281ce098c8f64e49f5f5dc9ea185
    let contractFuncData = '0xd66383cb'; //functions signature de isHoneypot(address)
    let callData = contractFuncData + encodedAddress.substring(2);
    // callData = 0xd66383cb + 0000000000000000000000005e9280d53f28281ce098c8f64e49f5f5dc9ea185
    // callData = 0xd66383cb0000000000000000000000005e9280d53f28281ce098c8f64e49f5f5dc9ea185

    let blacklisted = {
        '0xa914f69aef900beb60ae57679c5d4bc316a2536a': 'SPAMMING SCAM',
        '0xbbd1d56b4ccab9302aecc3d9b18c0c1799fe7525': 'Error: TRANSACTION_FROM_FAILED'
    };

    if (blacklisted[address.toLowerCase()] !== undefined) {
        let reason = blacklisted[address.toLowerCase()];
        warnings.push(reason)
    }

    let val = 100000000000000000;
    if (bnbIN < val) {
        val = bnbIN - 1000;
    }
    return web3.eth.call({
        to: '0x2bf75fd2fab5fc635a4c6073864c708dfc8396fc', // https://bscscan.com/bytecode-decompiler?a=0x2bf75fd2fab5fc635a4c6073864c708dfc8396fc
        from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3', // Binance: Hot Wallet 6
        value: val,
        gas: 45000000,
        data: callData, //0xd66383cb0000000000000000000000005e9280d53f28281ce098c8f64e49f5f5dc9ea185
    })
        .then((val) => {
            let decoded = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], val);
            let buyExpectedOut = web3.utils.toBN(decoded[0]);
            let buyActualOut = web3.utils.toBN(decoded[1]);
            let sellExpectedOut = web3.utils.toBN(decoded[2]);
            let sellActualOut = web3.utils.toBN(decoded[3]);
            let buyGasUsed = web3.utils.toBN(decoded[4]);
            let sellGasUsed = web3.utils.toBN(decoded[5]);
            buy_tax = Math.round((buyExpectedOut - buyActualOut) / buyExpectedOut * 100 * 10) / 10;
            sell_tax = Math.round((sellExpectedOut - sellActualOut) / sellExpectedOut * 100 * 10) / 10;
            if (buy_tax + sell_tax > 80) {
                warnings.push("Extremely high tax. Effectively a honeypot.")
            } else if (buy_tax + sell_tax > 40) {
                warnings.push("Really high tax.");
            }
            if (sellGasUsed > 1500000) {
                warnings.push("Selling costs a lot of gas.");
            }
            if (buyGasUsed > 1500000) {
                warnings.push("Buying costs a lot of gas.");
            }
            // console.log("warnings:")
            // for(var a in warnings){
            //     console.log(warnings[a])
            // }
            status = 'Bot can buy and sell st the moment'
            //console.log(`Buy Tax: ${buy_tax}% Sell Tax: ${sell_tax}%`)
            //console.log([status, buy_tax, sell_tax, warnings])
            return [status, buy_tax, sell_tax, warnings]
        })
        .catch(err => {
            if (err == 'Error: Returned error: execution reverted') {
                status = 'Error while checking'
                return[status, buy_tax, sell_tax, warnings];
            }
            console.log("HoneyPot!", err)
        });


}

// let a = honeypotIs('0x8901baf137ebbd549cafa5c2cb0731362898d136')
// a.then(r => {console.log(r)})

// def unknownd66383cb(uint256 _param1) payable: 
//   require calldata.size - 4 >=′ 32
//   require _param1 == addr(_param1)
// if 0x8894e0a0c962cb723c1976a4421c95949be2d4e3 != caller:
//       revert with 0, 'no.'
//   if not uint8(stor0.field_168):
//       revert with 0, 'no leeching'
//   if owner != 0x48f846b938a71c6e79b45aafd77e505aa0599fdc:
//       revert with 0, 'stop leeching'
//   create contract with callvalue wei
// code: 0xfe6080604052604051610aa6380380610aa683398101604081905261002291610729565b61002c8134610038565b5050505050505061097f565b60008060008060008060007310ed43c718714eb63d5aa57b78b54704e256024e905060006040518060c001604052806000815260200160008152602001600081526020016000815260200160008152602001600081525090506100a2828b8b61012860201b60201c565b6080840152602083018190529082526100bc908b906103c7565b6100d1828b83602001516104f460201b60201c565b60a08401819052606084018290526040840183905283516000819055602085015160018190556002859055600384905560809095015160048190556005839055909e949d50929b5090995090975095509350505050565b604080516002808252606082018352600092839283928392602083019080368337019050509050866001600160a01b031663ad5c46486040518163ffffffff1660e01b815260040160206040518083038186803b15801561018857600080fd5b505afa15801561019c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101c09190610729565b816000815181106101d3576101d3610953565b60200260200101906001600160a01b031690816001600160a01b031681525050858160018151811061020757610207610953565b6001600160a01b03928316602091820292909201015260405163d06ca61f60e01b815260009189169063d06ca61f9061024690899086906004016108d1565b60006040518083038186803b15801561025e57600080fd5b505afa158015610272573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f1916820160405261029a9190810190610759565b90506000816001815181106102b1576102b1610953565b6020026020010151905060005a9050896001600160a01b031663b6f9de958960008730426040518663ffffffff1660e01b81526004016102f4949392919061089c565b6000604051808303818588803b15801561030d57600080fd5b505af1158015610321573d6000803e3d6000fd5b505050505060005a610333908361092e565b6040516370a0823160e01b81523060048201529091508a906000906001600160a01b038316906370a082319060240160206040518083038186803b15801561037a57600080fd5b505afa15801561038e573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103b2919061083f565b949d949c50919a509298505050505050505050565b60405163095ea7b360e01b81527310ed43c718714eb63d5aa57b78b54704e256024e6004820152600019602482015282906001600160a01b0382169063095ea7b390604401602060405180830381600087803b15801561042657600080fd5b505af1925050508015610456575060408051601f3d908101601f191682019092526104539181019061081d565b60015b6104ee5760405163095ea7b360e01b81527310ed43c718714eb63d5aa57b78b54704e256024e6004820152602481018390526001600160a01b0382169063095ea7b390604401602060405180830381600087803b1580156104b657600080fd5b505af11580156104ca573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104ee919061081d565b50505050565b604080516002808252606082018352600092839283928392602083019080368337019050509050858160008151811061052f5761052f610953565b60200260200101906001600160a01b031690816001600160a01b031681525050866001600160a01b031663ad5c46486040518163ffffffff1660e01b815260040160206040518083038186803b15801561058857600080fd5b505afa15801561059c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105c09190610729565b816001815181106105d3576105d3610953565b6001600160a01b03928316602091820292909201015260405163d06ca61f60e01b815260009189169063d06ca61f9061061290899086906004016108d1565b60006040518083038186803b15801561062a57600080fd5b505afa15801561063e573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526106669190810190610759565b905060008160018151811061067d5761067d610953565b60200260200101519050600047905060005a60405163791ac94760e01b81529091506001600160a01b038c169063791ac947906106c7908c906000908a90309042906004016108f2565b600060405180830381600087803b1580156106e157600080fd5b505af11580156106f5573d6000803e3d6000fd5b5050505060005a610706908361092e565b90506000610714844761092e565b949d949c50909a509298505050505050505050565b60006020828403121561073b57600080fd5b81516001600160a01b038116811461075257600080fd5b9392505050565b6000602080838503121561076c57600080fd5b82516001600160401b038082111561078357600080fd5b818501915085601f83011261079757600080fd5b8151818111156107a9576107a9610969565b8060051b604051601f19603f830116810181811085821117156107ce576107ce610969565b604052828152858101935084860182860187018a10156107ed57600080fd5b600095505b838610156108105780518552600195909501949386019386016107f2565b5098975050505050505050565b60006020828403121561082f57600080fd5b8151801515811461075257600080fd5b60006020828403121561085157600080fd5b5051919050565b600081518084526020808501945080840160005b838110156108915781516001600160a01b03168752958201959082019060010161086c565b509495945050505050565b8481526080602082015260006108b56080830186610858565b6001600160a01b03949094166040830152506060015292915050565b8281526040602082015260006108ea6040830184610858565b949350505050565b85815284602082015260a06040820152600061091160a0830186610858565b6001600160a01b0394909416606083015250608001529392505050565b60008282101561094e57634e487b7160e01b600052601160045260246000fd5b500390565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6101188061098e6000396000f3fe608060405260043610602a5760003560e01c8063098d322814603557806392093dd614605c57600080fd5b36603057005b600080fd5b348015604057600080fd5b50604960001981565b6040519081526020015b60405180910390f35b348015606757600080fd5b5060b66040805160c08101825260005480825260015460208301819052600254938301849052600354606084018190526004546080850181905260055460a09095018590529295919493909291565b604080519687526020870195909552938501929092526060840152608083015260a082015260c001605356fea2646970667358221220e61b2cbf46961b8942b7c03d52bec7df942b4fe01eddb0595a91c4a994b64ae864736f6c634300080700, addr(_param1)
// if not create.new_address:
//       revert with ext_call.return_data[0 len return_data.size]
//   require ext_code.size(addr(create.new_address))
//   static call addr(create.new_address).getLastResult() with:
//           gas gas_remaining wei
// if not ext_call.success:
//       revert with ext_call.return_data[0 len return_data.size]
//   require return_data.size >=′ 192
// return ext_call.return_data[0],
//     ext_call.return_data[32],
//     ext_call.return_data[64],
//     ext_call.return_data[96],
//     ext_call.return_data[128],
//     ext_call.return_data[160]