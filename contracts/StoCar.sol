// SPDX-License-Identifier: CC-BY-SA-4.0
pragma solidity >=0.8.0 <0.9.0;

contract StoCar{
    address payable public creator;
    uint public counter;

    event NewCounterState(address sender, uint counter);

    constructor() {
        //require(seed > 0, "Please provide a seed that is greater than 0!");
        creator = payable(msg.sender);
        
        counter = 0;
    }

    function count() public{
        counter++;

        emit NewCounterState(msg.sender, counter);
    }
}