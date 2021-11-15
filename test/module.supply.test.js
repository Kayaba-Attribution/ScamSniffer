const supplytest = require('../modules/module.supply.js')
var expect = require("chai").expect;

const failAST = {"type":"SourceUnit","children":[{"type":"PragmaDirective","name":"solidity","value":"^0.8.0"},{"type":"ContractDefinition","name":"SupplyTest","baseContracts":[],"subNodes":[{"type":"StateVariableDeclaration","variables":[{"type":"VariableDeclaration","typeName":{"type":"ElementaryTypeName","name":"uint256","stateMutability":null},"name":"_maxSupply","identifier":{"type":"Identifier","name":"_maxSupply"},"expression":null,"visibility":"private","isStateVar":true,"isDeclaredConst":false,"isIndexed":false,"isImmutable":false,"override":null,"storageLocation":null}],"initialValue":null},{"type":"FunctionDefinition","name":"MaxSupply","parameters":[],"returnParameters":[{"type":"VariableDeclaration","typeName":{"type":"ElementaryTypeName","name":"uint256","stateMutability":null},"name":null,"identifier":null,"storageLocation":null,"isStateVar":false,"isIndexed":false,"expression":null}],"body":{"type":"Block","statements":[{"type":"ReturnStatement","expression":{"type":"Identifier","name":"_maxSupply"}}]},"visibility":"public","modifiers":[],"override":[],"isConstructor":false,"isReceiveEther":false,"isFallback":false,"isVirtual":true,"stateMutability":"view"}],"kind":"contract"}]}

const passAST = {"type":"SourceUnit","children":[{"type":"PragmaDirective","name":"solidity","value":"^0.8.0"},{"type":"ContractDefinition","name":"SupplyTest","baseContracts":[],"subNodes":[{"type":"StateVariableDeclaration","variables":[{"type":"VariableDeclaration","typeName":{"type":"ElementaryTypeName","name":"uint256","stateMutability":null},"name":"_totalSupply","identifier":{"type":"Identifier","name":"_totalSupply"},"expression":null,"visibility":"private","isStateVar":true,"isDeclaredConst":false,"isIndexed":false,"isImmutable":false,"override":null,"storageLocation":null}],"initialValue":null},{"type":"FunctionDefinition","name":"totalSupply","parameters":[],"returnParameters":[{"type":"VariableDeclaration","typeName":{"type":"ElementaryTypeName","name":"uint256","stateMutability":null},"name":null,"identifier":null,"storageLocation":null,"isStateVar":false,"isIndexed":false,"expression":null}],"body":{"type":"Block","statements":[{"type":"ReturnStatement","expression":{"type":"Identifier","name":"_totalSupply"}}]},"visibility":"public","modifiers":[],"override":[],"isConstructor":false,"isReceiveEther":false,"isFallback":false,"isVirtual":true,"stateMutability":"view"}],"kind":"contract"}]}

const passReport = supplytest(passAST)
const failReport = supplytest(failAST)

describe("[Supply Module] Supply Variable and Supply Getter", function() {
    
  // specification code
    it("Checks for 0 findings on pass AST", function() {
          expect(passReport.findings.length).to.equal(0)
    });
    it("Checks for 2 logs on pass AST", function() {
          expect(passReport.log.length).to.equal(2)
    });
    it("Checks for 2 findings on fail AST", function() {
          expect(failReport.findings.length).to.equal(2)
    });
    it("Checks for 0 logs on fail AST", function() {
          expect(failReport.log.length).to.equal(0)
    });
});