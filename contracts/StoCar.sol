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
    mapping(address=>Auction) auctions; //list of open auctions where the keys
                                        //is owner's address

    //Events declaration
    event TaxChanged(uint64 new_tax);
    event AuctionOpened(address owner);

    constructor(uint64 starting_tax) {
        //require(seed > 0, "Please provide a seed that is greater than 0!");
        creator = payable(msg.sender);
        tax = starting_tax;
    }

    function nothing() public{
        
    }

    function openAuction(uint256 starting_price, uint16 max_duration) public{
        require(auctions[msg.sender].owner == address(0), "Only one open auction per user.");

        auctions[msg.sender] = Auction({
            owner: msg.sender,
            current_winner: address(0),
            offer: starting_price,
            duration: max_duration
        });

        emit AuctionOpened(msg.sender);
    }

    function changeFixedTax(uint64 new_tax) public{
        require(msg.sender == creator, "You are not the creator of the contract.");
        
        tax = new_tax;

        emit TaxChanged(new_tax);
    }

}