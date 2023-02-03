// SPDX-License-Identifier: CC-BY-SA-4.0
pragma solidity >=0.8.0 <0.9.0;

contract StoCar{ 
    address payable private creator;
    
    struct CarNFT{
        bytes32 chassis_id; //hash of the chassis number computed with keccak256
    }

    struct Auction{
        address owner; //user that owns the auction
        address current_winner; //user that has currently sent the highest offer
        uint256 offer; //either starting price or highest offer
        CarNFT car;
        uint256 starting_price;
        uint256 start_timestamp; //timestamp at which the auction started
        uint duration; //maximum duration of the auction in hours
    }
    
    uint64 public tax; //applied transaction tax in WEI
    
    //uint256 public balance; //keep the balance of the contract PROBABLY NOT USEFUL TO REMOVE

    address[] internal sellers; //list of all the sellers

    mapping(address=>Auction) internal open_auctions; //list of all the auctions where the key
                                                    //is the owner's address
    mapping(address=>Auction) internal closed_auctions; //list of all the closed auctions

    mapping(bytes32=>CarNFT) internal tokens_open; //list of all the NFTs in currently opened auctions

    mapping(bytes32=>CarNFT) internal tokens_closed; //list of all the NFTs in closed auctions

    //Events declaration
    event TaxChanged(uint64 new_tax);
    event AuctionOpened(address owner);
    event OfferAccepted(address owner, address offerer, uint256 past_offer, uint256 new_offer);
    event AuctionClosed();
    event Debug(uint value1,uint value2, uint value3);

    constructor(uint64 starting_tax) {
        creator = payable(msg.sender);
        tax = starting_tax;
        //balance = 0;
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
        require(max_duration > 0, "The duration has to be greater than 0.");
        require(open_auctions[msg.sender].owner == address(0), "Only one open auction per user.");
        require(starting_price >= tax, "The starting price of an auction has to be greater or equal than the fixed tax.");
        require(tokens_open[chassis_id].chassis_id == bytes4(0), "You cannot sell a car that someone else is already selling!!");

        //change duration from hours to seconds
        uint in_secs = max_duration*3600;

        //check if the token already exists, if not create a new one
        CarNFT memory car = CarNFT({chassis_id: 0});
        if(tokens_closed[chassis_id].chassis_id == bytes4(0)){
            car = CarNFT({
                chassis_id: chassis_id
            });
            tokens_open[chassis_id] = car; //create new token
        }else{
            car = tokens_closed[chassis_id]; //use the one already existing
        }
        
        open_auctions[msg.sender] = Auction({
            owner: msg.sender,
            current_winner: address(0),
            offer: 0,
            car: car,
            starting_price: starting_price,
            start_timestamp: block.timestamp,
            duration: block.timestamp+in_secs
        });

        uint check = 0;
        for(uint i = 0; i < sellers.length; i++){
            if(sellers[i] == msg.sender){
                check = 1;
                break;
            }
        }
        if(check == 0){
            sellers.push(msg.sender);
        }

        emit AuctionOpened(msg.sender);
    }

    
    function getOpenAuctions() public view returns (Auction[] memory){
        /*original
        Auction[] memory ret = new Auction[](sellers.length);

        for(uint i = 0; i < sellers.length; i++){
            address seller = sellers[i];

            //Don't insert auctions that don't exist
            if(open_auctions[seller].owner != address(0)){
                ret[i] = open_auctions[seller];
            }
        }*/

        uint[] memory empty = new uint[](sellers.length);
        uint total = 0;

        for(uint i = 0; i < sellers.length; i++){
            if(open_auctions[sellers[i]].owner == address(0)){
                empty[i] = 1;
                total+=1;
            }
        }
        Auction[] memory ret = new Auction[]((sellers.length-total));
        uint index = 0;
        for(uint i = 0; i < sellers.length; i++){
            if(empty[i] == 0){
                ret[index] = open_auctions[sellers[i]];
                index+=1;
            }
        }

        return ret;
    }

    function getOpenAuction(address owner_id) public view returns (Auction memory){
        Auction memory ret = open_auctions[owner_id];

        require(ret.owner != address(0), "The open auction you are searching doesn't exist.");

        return ret;
    }

    //function participateAuction(address owner_addr, uint256 new_offer) payable public CheckExpiry(owner_addr){
    function participateAuction(address owner_addr, uint256 new_offer) payable public {
        require(open_auctions[owner_addr].owner != address(0), "The auction doesn't exist."); //Check if the auction exists
        require((new_offer-tax)>open_auctions[owner_addr].starting_price, "The new offer has to be greater than the starting price.");
        require((new_offer-tax)>open_auctions[owner_addr].offer, "The new offer has to be greater than the current offer.");

        //check if auction is to be closed NOT TESTED IF IT WORKS
        if(block.timestamp > open_auctions[owner_addr].duration){ 
            //The auction time is expired
            closeAuction(owner_addr);
            return;
        }
        
        //when the new offer is accepted, the past offer is to be returned to the account who sent it
        //balance += tax;
        payable(open_auctions[owner_addr].current_winner).transfer(open_auctions[owner_addr].offer); //every exchange should be in Weis
        //emit Debug(open_auctions[owner_addr].offer, msg.value, new_offer);
        
        uint256 past_offer = open_auctions[owner_addr].offer;
        open_auctions[owner_addr].current_winner = msg.sender;
        open_auctions[owner_addr].offer = (new_offer-tax); //detract the fixed tax from the total amount offered
        
        emit OfferAccepted(owner_addr, msg.sender, past_offer, (new_offer-tax));
    }

    /*non so se serva fare un'altra funzione
    function transferEther(address, _to, uint _amount) public payable {
        address(_to).transfer(_amount);
    }*/


    function closeAuction(address owner_addr) public{
        require(open_auctions[owner_addr].owner != address(0), "The auction doesn't exist."); //Check if the auction exists (just to be sure)

        //tax is paid for opening the auction (or better detracted from the value that is trasnferred to the owner of the auction)
        //but only if someone made an offer and the token exchange is finalized, otherwise no tax is detracted, and no token is sent 
        if(open_auctions[owner_addr].offer != 0){
            open_auctions[owner_addr].offer -= tax;
            //balance += tax;
            /////////////////////////SEND TOKEN HERE IN SOME WAY: MAYBE MAPPING AND HERE ADD TOKEN FOR THE WINNER ADDR
        }
        payable(open_auctions[owner_addr].owner).transfer(open_auctions[owner_addr].offer); //updated value is transferred to the auction's owner
        
        //now the contract state is updated
        closed_auctions[owner_addr] = open_auctions[owner_addr]; //add auction to closed auctions
        tokens_closed[open_auctions[owner_addr].car.chassis_id] = tokens_open[open_auctions[owner_addr].car.chassis_id]; //add token to tokens of closed auctions
        delete tokens_open[open_auctions[owner_addr].car.chassis_id]; //remove token from tokens of open auctions
        delete open_auctions[owner_addr]; //remove auction from open auctions

        emit AuctionClosed();
    }


    function getCarHistory(bytes32 chassis_id) view public returns (Auction[] memory){
        //complete
    }


    function getTax() public view returns(uint64 ret){
        //emit Debug(tax,tax,tax);
        return tax;
    }
    function changeFixedTax(uint64 new_tax) public{
        require(msg.sender == creator, "You are not the creator of the contract.");
        
        tax = new_tax; //Wei
        emit TaxChanged(new_tax);
    }

    /*function withdraw() public{
        require(msg.sender == creator, "You are not the creator of the contract.");
        //payable(msg.sender).transfer(balance); TRANSFER SOMETHING HERE BUT DON'T KNOW WHAT STILL
    }*/

    /*function getContractBalance() public view returns(uint256){
        return balance; PROBABLY NOT EVEN USEFUL
    }*/


}