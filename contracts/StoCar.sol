// SPDX-License-Identifier: CC-BY-SA-4.0
pragma solidity >=0.8.0 <0.9.0;

contract StoCar{
    address payable private creator;
    uint64 public tax; //applied transaction tax in WEI
    
    struct Auction{
        address owner; //user that owns the auction
        address current_winner; //user that has currently sent the highest offer
        uint256 offer; //either starting price or highest offer
        uint16 duration; //maximum duration of the auction in hours
    }

    struct CarNFT{
        bytes32 id; //hash of the chassis number computed with keccak256
    }

    mapping(address=>Auction) open_auctions; //list of all the auctions where the keys
                                             //is owner's address
    mapping(address=>Auction) closed_auctions; //list of all the closed auctions

    //Events declaration
    event TaxChanged(uint64 new_tax);
    event AuctionOpened(address owner);

    constructor(uint64 starting_tax) {
        //require(seed > 0, "Please provide a seed that is greater than 0!");
        creator = payable(msg.sender);
        tax = starting_tax;
    }

    function openAuction(uint256 starting_price, uint16 max_duration) public{
        require(open_auctions[msg.sender].owner == address(0), "Only one open auction per user.");

        open_auctions[msg.sender] = Auction({
            owner: msg.sender,
            current_winner: address(0),
            offer: starting_price,
            duration: max_duration
        });

        emit AuctionOpened(msg.sender);
    }

    function changeFixedTax(uint64 new_tax) public{
        require(msg.sender == creator, "You are not the creator of the contract."); //maybe cast to payable needed
        
        tax = new_tax;

        emit TaxChanged(new_tax);
    }

}