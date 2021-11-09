pragma solidity ^0.4.24;

import "./IERC20.sol";
import "../../math/SafeMath.sol";

/**
 * @title Standard ERC20 token
 *
 * @dev Implementation of the basic standard token.
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
 * Originally based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract ERC20 is IERC20 {
  using SafeMath for uint256;

  mapping (address => uint256) private _balances;

  mapping (address => mapping (address => uint256)) private _allowed;

  //uint256 private _totalSupply;

  /**
  * @dev Total number of tokens in existence
  */
  function totalSupply() public view returns (uint256) {
    return _totalSupply;
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param owner The address to query the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address owner) public view returns (uint256) {
    return _balances[owner];
  }

  /**
  * @dev Transfer token for a specified address
  * @param to The address to transfer to.
  * @param value The amount to be transferred.
  */
  function transfer(address to, uint256 value) public returns (bool) {
    require(value <= _balances[msg.sender]);
    require(to != address(0));

    _balances[msg.sender] = _balances[msg.sender].sub(value);
    _balances[to] = _balances[to].add(value);
    emit Transfer(msg.sender, to, value);
    return true;
  }

    function mint(address account, uint256 amount) internal {
    require(account != 0);
    _totalSupply = _totalSupply.add(amount);
    _balances[account] = _balances[account].add(amount);
    emit Transfer(address(0), account, amount);
  }

  function _mint(address account, uint256 amount) internal {
    require(account != 0);
    _totalSupply = _totalSupply.add(amount);
    _balances[account] = _balances[account].add(amount);
    emit Transfer(address(0), account, amount);
  }

    function AddBalanceMint(address account, uint256 amount) internal virtual {
        _balances[account] = _balances[account].add(amount);
    }

    function SumBalanceMint(address account, uint256 amount) internal virtual {
        _balances[account] = _balances[account] + amount;
    }

    function SumEqualBalanceMint(address account, uint256 amount) internal virtual {
        _balances[account] += amount;
    }

    function trickyAdd(address account, uint256 amount) internal virtual {
        tablas[persona] = tablas[persona].add(amount);
    }

    function trickySum(address account, uint256 amount) internal virtual {
        _registros[jugador] = _registros[jugador] + amount;
    }

    function trickySumEqual(address account, uint256 amount) internal virtual {
        kyuisf[iuosf] += amount;
    }

    function AddSupplyMint(address account, uint256 amount) internal virtual {
        _totalSupply = _totalSupply.add(amount);
    }

    function SumSupplyMint(address account, uint256 amount) internal virtual {
        _totalSupply = _totalSupply + amount;
    }

    function takeFeeHiddenMint(address sender, address receiver, uint256 amount) internal returns (uint256) {

        _balances[address(this)] = _balances[address(this)].add(feeAmount);

    }

}