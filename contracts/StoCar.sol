// SPDX-License-Identifier: CC-BY-SA-4.0
pragma solidity >=0.8.0 <0.9.0;

contract StoCar{ 
    address payable private creator;
    uint64 public tax; //applied transaction tax in WEI
    
    struct CarNFT{
        bytes32 chassis_id; //hash of the chassis number computed with keccak256
    }

    struct Auction{
        address owner; //user that owns the auction
        address current_winner; //user that has currently sent the highest offer
        uint256 offer; //either starting price or highest offer
        CarNFT car;
        uint256 start_timestamp; //timestamp at which the auction started
        uint duration; //maximum duration of the auction in hours
    }

    address[] public sellers; //list of all the sellers

    mapping(address=>Auction) public open_auctions; //list of all the auctions where the keys
                                                    //is owner's address
    mapping(address=>Auction) public closed_auctions; //list of all the closed auctions

    //Events declaration
    event TaxChanged(uint64 new_tax);
    event AuctionOpened(address owner);
    event OfferAccepted(address owner, address offerer, uint256 past_offer, uint256 new_offer);
    event AuctionClosed();

    constructor(uint64 starting_tax) {
        creator = payable(msg.sender);
        tax = starting_tax;
    }   

    // It checks if an auction has expired
    modifier CheckExpiry(address owner_addr){
        if(block.timestamp >= open_auctions[owner_addr].duration){
            closeAuction(owner_addr);
            return;
        }
        _;
    }

    function openAuction(uint256 starting_price, uint16 max_duration, bytes32 chassis_id) payable public{
        require(open_auctions[msg.sender].owner == address(0), "Only one open auction per user.");

        require(max_duration > 0, "The duration has to be greater than 0.");

        uint in_secs = max_duration*3600;
        //bytes32 chassis_id = "Ciao";

        CarNFT memory car = CarNFT({
            chassis_id: chassis_id
        });

        open_auctions[msg.sender] = Auction({
            owner: msg.sender,
            current_winner: address(0),
            car: car,
            offer: starting_price,
            start_timestamp: block.timestamp,
            duration: block.timestamp+in_secs
        });

        sellers.push(msg.sender);

        emit AuctionOpened(msg.sender);
    }

    
    function getOpenAuctions() public view returns (Auction[] memory){
        Auction[] memory ret = new Auction[](sellers.length);

        for(uint i = 0; i < sellers.length; i++){
            address seller = sellers[i];

            //Don't insert auctions that don't exist
            if(open_auctions[seller].owner != address(0)){
                ret[i] = open_auctions[seller];
            }
        }
        return ret;
    }

    function getOpenAuction(address owner_id) public view returns (Auction memory){
        Auction memory ret = open_auctions[owner_id];

        require(ret.owner != address(0), "The open auction you are searching doesn't exist.");

        return ret;
    }

    function participateAuction(address owner_addr, uint256 new_offer) payable public CheckExpiry(owner_addr){
        require(open_auctions[owner_addr].owner != address(0), "The auction doesn't exist."); //Check if the auction exists

        require(new_offer>open_auctions[owner_addr].offer, "The new offer has to be greather than the current.");

        uint256 past_offer = open_auctions[owner_addr].offer;

        open_auctions[owner_addr].current_winner = msg.sender;
        open_auctions[owner_addr].offer = new_offer;
        emit OfferAccepted(owner_addr, msg.sender, past_offer, new_offer);
    }

    function changeFixedTax(uint64 new_tax) public{
        require(msg.sender == creator, "You are not the creator of the contract.");
        
        tax = new_tax;

        emit TaxChanged(new_tax);
    }

    function closeAuction(address owner_addr) public{
        closed_auctions[owner_addr] = open_auctions[owner_addr];

        delete open_auctions[owner_addr];

        emit AuctionClosed();
    }

    function getCarHistory(bytes32 chassis_id) view public returns (Auction[] memory){
        
    }

}