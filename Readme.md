# KAYABA SCAM SNIFFER

### Dependecies:

*@solidity-parser/parser
*treeify
*colors 

### Installation:

Git clone and run:

```npm add @solidity-parser/parser treeify colors```

### General Logic
***
1. We parse the contract code to generate an AST of the code
2. Use treeify to visualize the tree
3. Visit all the nodes in the tree an implement our searches

##### Sniffer.js

Takes a contract file and returns the findings.

Extras:

*node_kind is used to diferenciar the type of general node ie: interface vs contract vs library.

*uses_totalSupply is a boolean to check if the contract has the declaration of _totalSupply.

*Inside parse.visit() there are subfunctions based on the node:
    * ContractDefinition() library, interface, contract
    * StateVariableDeclaration() variables declarations
    * FunctionDefinition() functions

### Explanation of development
```
This is the tree for a function on the contract hiddenMint.sol
16
      │     ├─ type: FunctionDefinition
      │     ├─ name: takeFeeHiddenMint
      │     ├─ parameters
      │     │  ├─ 0
      │     │  │  ├─ type: VariableDeclaration
      │     │  │  ├─ typeName
      │     │  │  │  ├─ type: ElementaryTypeName
      │     │  │  │  ├─ name: address
      │     │  │  │  └─ stateMutability
      │     │  │  ├─ name: sender
      │     │  │  ├─ identifier
      │     │  │  │  ├─ type: Identifier
      │     │  │  │  └─ name: sender
      │     │  │  ├─ storageLocation
      │     │  │  ├─ isStateVar: false
      │     │  │  ├─ isIndexed: false
      │     │  │  └─ expression
      │     │  ├─ 1
      │     │  │  ├─ type: VariableDeclaration
      │     │  │  ├─ typeName
      │     │  │  │  ├─ type: ElementaryTypeName
      │     │  │  │  ├─ name: address
      │     │  │  │  └─ stateMutability
      │     │  │  ├─ name: receiver
      │     │  │  ├─ identifier
      │     │  │  │  ├─ type: Identifier
      │     │  │  │  └─ name: receiver
      │     │  │  ├─ storageLocation
      │     │  │  ├─ isStateVar: false
      │     │  │  ├─ isIndexed: false
      │     │  │  └─ expression
      │     │  └─ 2
      │     │     ├─ type: VariableDeclaration
      │     │     ├─ typeName
      │     │     │  ├─ type: ElementaryTypeName
      │     │     │  ├─ name: uint256
      │     │     │  └─ stateMutability
      │     │     ├─ name: amount
      │     │     ├─ identifier
      │     │     │  ├─ type: Identifier
      │     │     │  └─ name: amount
      │     │     ├─ storageLocation
      │     │     ├─ isStateVar: false
      │     │     ├─ isIndexed: false
      │     │     └─ expression
      │     ├─ returnParameters
      │     │  └─ 0
      │     │     ├─ type: VariableDeclaration
      │     │     ├─ typeName
      │     │     │  ├─ type: ElementaryTypeName
      │     │     │  ├─ name: uint256
      │     │     │  └─ stateMutability
      │     │     ├─ name
      │     │     ├─ identifier
      │     │     ├─ storageLocation
      │     │     ├─ isStateVar: false
      │     │     ├─ isIndexed: false
      │     │     └─ expression
      │     ├─ body **Most of the work is done inside the body**
      │     │  ├─ type: Block
      │     │  └─ statements **The group of all the statemnts can have ExpressionStatement, EmitStatement, ReturnStatement, IfStatement etc**
      │     │     └─ 0 **Here is the code for this statement:** _balances[address(this)] = _balances[address(this)].add(feeAmount);
      │     │        ├─ type: ExpressionStatement
      │     │        └─ expression
      │     │           ├─ type: BinaryOperation
      │     │           ├─ operator: =
      │     │           ├─ left **_balances[address(this)]**
      │     │           │  ├─ type: IndexAccess
      │     │           │  ├─ base **_balances**
      │     │           │  │  ├─ type: Identifier
      │     │           │  │  └─ name: _balances
      │     │           │  └─ index **address(this)**
      │     │           │     ├─ type: FunctionCall
      │     │           │     ├─ expression
      │     │           │     │  ├─ type: TypeNameExpression
      │     │           │     │  └─ typeName
      │     │           │     │     ├─ type: ElementaryTypeName
      │     │           │     │     ├─ name: address
      │     │           │     │     └─ stateMutability
      │     │           │     ├─ arguments
      │     │           │     │  └─ 0
      │     │           │     │     ├─ type: Identifier
      │     │           │     │     └─ name: this
      │     │           │     ├─ names
      │     │           │     └─ identifiers
      │     │           └─ right **_balances[address(this)].add(feeAmount);**
      │     │              ├─ type: FunctionCall
      │     │              ├─ expression
      │     │              │  ├─ type: MemberAccess
      │     │              │  ├─ expression
      │     │              │  │  ├─ type: IndexAccess
      │     │              │  │  ├─ base **_balances**
      │     │              │  │  │  ├─ type: Identifier
      │     │              │  │  │  └─ name: _balances
      │     │              │  │  └─ index **address(this)**
      │     │              │  │     ├─ type: FunctionCall
      │     │              │  │     ├─ expression
      │     │              │  │     │  ├─ type: TypeNameExpression
      │     │              │  │     │  └─ typeName
      │     │              │  │     │     ├─ type: ElementaryTypeName
      │     │              │  │     │     ├─ name: address
      │     │              │  │     │     └─ stateMutability
      │     │              │  │     ├─ arguments
      │     │              │  │     │  └─ 0
      │     │              │  │     │     ├─ type: Identifier
      │     │              │  │     │     └─ name: this
      │     │              │  │     ├─ names
      │     │              │  │     └─ identifiers
      │     │              │  └─ memberName: add **.add**
      │     │              ├─ arguments
      │     │              │  └─ 0
      │     │              │     ├─ type: Identifier
      │     │              │     └─ name: feeAmount **feeAmount**
      │     │              ├─ names
      │     │              └─ identifiers
      │     ├─ visibility: internal
      │     ├─ modifiers
      │     ├─ override
      │     ├─ isConstructor: false
      │     ├─ isReceiveEther: false
      │     ├─ isFallback: false
      │     ├─ isVirtual: false
      │     └─ stateMutability
      └─ kind: contract
```
***
We write logic to find what we want in the example case we would use

```javascript

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
        // Take care of index acceses with functions ie. address(this)
        if (indexedindex == undefined) { indexedindex = s.expression.left.index.type}
    } catch (e) {
        if (e.name != 'TypeError') {
            console.log(`[ERROR] Left IndexAccesCheck at ${node.name}`.red)
        }
    }
    try {
        //Check right for add
        let isAdd = (s.expression.right.expression.memberName == 'add') ? true : false;
        if (isIndexAccess && isAdd) {
            alerts.push(`[Addition in "${node.name}"]: IndexAccess ${indexedBase}[${indexedindex}] and add()`.red)
        }
    } catch (e) {
        if (e.name != 'TypeError') {
            console.log(`[ERROR] Add() check at ${node.name}`.red)
        }
    }
}
```

All alerts are added to the alert array and displayed at the end.

## Current Features:

* Extra Statements Identification   (modular but could fire an alert one a good statement)
* Extra Modifiers Identification    (only on _transfer atm)
* Addition Identification:
    * add()
    * +
    * +=

Install Surya (not required but cool)

npm install -g surya

https://github.com/ConsenSys/surya