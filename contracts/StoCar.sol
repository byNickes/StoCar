// SPDX-License-Identifier: CC-BY-SA-4.0
pragma solidity >=0.8.0 <0.9.0;

contract StoCar{ 
    address payable private creator;
    
    struct CarNFT{
        bytes12 chassis_id; //hash of the chassis number computed with keccak256
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
    
    uint64 private tax; //applied transaction tax in WEI
    
    uint256 private collected_taxes; //keep the amount of taxes collected by the contract (in WEI)

    address[] internal sellers; //list of all the sellers

    mapping(address=>Auction) internal open_auctions; //list of all the auctions where the key
                                                    //is the owner's address
    mapping(address=>Auction) internal closed_auctions; //list of all the closed auctions

    mapping(bytes12=>CarNFT) internal tokens_open; //list of all the NFTs in currently opened auctions

    mapping(bytes12=>CarNFT) internal tokens_closed; //list of all the NFTs in closed auctions

    mapping(address=>CarNFT[]) public token_balance; //each account with the relative tokens

    //Events declaration
    event TaxChanged(uint64 new_tax);
    event AuctionOpened(address owner, bytes12 chassis_id);
    event OfferAccepted(address owner, address offerer, uint256 past_offer, uint256 new_offer);
    event AuctionClosed();
    event Withdrawn(uint256 taxes);
    event TokenBalanceAccessed(address owner, uint token_num, bytes12 chassis_id, bytes12 zero);
    event Debug(uint value); 

    constructor(uint64 starting_tax) {
        creator = payable(msg.sender);
        tax = starting_tax;
        collected_taxes = 0;
    }   

    // It checks if an auction has expired
    modifier CheckExpiry(address owner_addr){
        if(block.timestamp >= open_auctions[owner_addr].duration){
            closeAuction(owner_addr);
            return;
        }
        _;
    }

    function openAuction(uint256 starting_price, uint16 max_duration, bytes12 chassis_id) public{
        require(max_duration > 0, "The duration has to be greater than 0.");
        require(open_auctions[msg.sender].owner == address(0), "Only one open auction per user.");
        require(starting_price >= tax, "The starting price of an auction has to be greater or equal than the fixed tax.");
        require(tokens_open[chassis_id].chassis_id == bytes12(0), "You cannot sell a car that someone else is already selling!!");

        //check if the token already exists, if not create a new one
        CarNFT memory car;// = CarNFT({chassis_id: 0});
        if(tokens_closed[chassis_id].chassis_id == bytes12(0)){
            car = CarNFT({
                chassis_id: chassis_id
            }); //create new token
        }
        else{
            uint presence = 0;
            uint index = 0;
            car = tokens_closed[chassis_id]; //use the one already existing

            for(uint i = 0; i < token_balance[msg.sender].length; i++){
                if(token_balance[msg.sender][i].chassis_id == car.chassis_id){ 
                    //token is in the sender's possession
                    presence = 1;
                    index = i;
                    break;
                }
            }
            //if the sender is trying to sell an already existing token without having it in possession, revert
            require(presence == 1, "You cannot sell something that you don't have!");

            //at this point, remove token from the sender possession (so that at the end it can be added to the next owner balance)
            emit TokenBalanceAccessed(msg.sender, token_balance[msg.sender].length, token_balance[msg.sender][index].chassis_id,car.chassis_id);
            token_balance[msg.sender][index] = CarNFT({chassis_id: 0});
            delete tokens_closed[chassis_id];
        }

        tokens_open[chassis_id] = car; //add token reference to auction

        open_auctions[msg.sender] = Auction({
            owner: msg.sender,
            current_winner: address(0),
            offer: 0,
            car: car,
            starting_price: starting_price,
            start_timestamp: block.timestamp,
            duration: block.timestamp+(max_duration * 1 hours)
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

        emit AuctionOpened(msg.sender,chassis_id);
    }

    
    function getOpenAuctions() public view returns (Auction[] memory){
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

    function participateAuction(address owner_addr, uint256 new_offer) payable public CheckExpiry(owner_addr){
        require(open_auctions[owner_addr].owner != address(0), "The auction doesn't exist."); //Check if the auction exists
        require((new_offer-tax)>open_auctions[owner_addr].starting_price, "The new offer has to be greater than the starting price.");
        require((new_offer-tax)>open_auctions[owner_addr].offer, "The new offer has to be greater than the current offer.");
        
        //when the new offer is accepted, the past offer is to be returned to the account who sent it
        collected_taxes = collected_taxes + tax;

        payable(open_auctions[owner_addr].current_winner).transfer(open_auctions[owner_addr].offer); //every exchange should be in Weis
        //emit Debug(open_auctions[owner_addr].offer, msg.value, new_offer);
        
        uint256 past_offer = open_auctions[owner_addr].offer;
        open_auctions[owner_addr].current_winner = msg.sender;
        open_auctions[owner_addr].offer = (new_offer-tax); //detract the fixed tax from the total amount offered
        
        emit OfferAccepted(owner_addr, msg.sender, past_offer, (new_offer-tax));
    }


    function closeAuction(address owner_addr) public{
        require(open_auctions[owner_addr].owner != address(0), "The auction doesn't exist."); //Check if the auction exists (just to be sure)

        //tax is paid for opening the auction (or better detracted from the value that is trasnferred to the owner of the auction)
        //but only if someone made an offer and the token exchange is finalized, otherwise no tax is detracted, and no token is sent 
        if(open_auctions[owner_addr].offer != 0){ //an offer was made, the highest one (which is the last one) wins
            open_auctions[owner_addr].offer -= tax;
            collected_taxes = collected_taxes + tax;

            token_balance[open_auctions[owner_addr].current_winner].push(open_auctions[owner_addr].car); //token added to winner balance
            emit TokenBalanceAccessed(open_auctions[owner_addr].current_winner, token_balance[open_auctions[owner_addr].current_winner].length,token_balance[open_auctions[owner_addr].current_winner][0].chassis_id, bytes12(0));
        }
        else{ //no offer was made
            token_balance[owner_addr].push(open_auctions[owner_addr].car); //token added to previous owner balance
            emit TokenBalanceAccessed(owner_addr, token_balance[owner_addr].length,token_balance[owner_addr][0].chassis_id, bytes12(0));

        }
        payable(open_auctions[owner_addr].owner).transfer(open_auctions[owner_addr].offer); //updated value is transferred to the auction's owner
        
        //now the contract state is updated
        closed_auctions[owner_addr] = open_auctions[owner_addr]; //add auction to closed auctions
        tokens_closed[open_auctions[owner_addr].car.chassis_id] = tokens_open[open_auctions[owner_addr].car.chassis_id]; //add token to tokens of closed auctions
        delete tokens_open[open_auctions[owner_addr].car.chassis_id]; //remove token from tokens of open auctions
        delete open_auctions[owner_addr]; //remove auction from open auctions

        emit AuctionClosed();
    }

    function getCarHistory(bytes12 chassis_id) view public returns (Auction[] memory){
        // find auctions of a specific chassis_id

        uint[] memory open_presence = new uint[](sellers.length);
        uint[] memory closed_presence = new uint[](sellers.length);
        uint total = 0;

        for(uint i = 0; i < sellers.length; i++){
            if(open_auctions[sellers[i]].car.chassis_id == chassis_id){
                open_presence[i] = 1;
                total+=1;
            }
            else if(closed_auctions[sellers[i]].car.chassis_id == chassis_id){
                closed_presence[i] = 1;
                total+=1;
            }
        }

        Auction[] memory ret = new Auction[](total);
        uint index = 0;
        for(uint i = 0; i < sellers.length; i++){
            if(open_presence[i] == 1){
                ret[index] = open_auctions[sellers[i]];
                index+=1;
            } 
            else if(closed_presence[i] == 1){
                ret[index] = closed_auctions[sellers[i]];
                index+=1;
            }
        }

        return ret;

    }


    function getTax() public view returns(uint64 ret){
        return tax;
    }
    function getCreator() public view returns(address){
        return creator;
    }
    function changeFixedTax(uint64 new_tax) public{
        require(msg.sender == creator, "You are not the creator of the contract.");
        
        tax = new_tax; //Wei
        emit TaxChanged(new_tax);
    }

    function withdraw() payable public returns(uint256) {

        require(msg.sender == creator, "You are not the creator of the contract.");

        payable(msg.sender).transfer(collected_taxes);
        
        emit Withdrawn(collected_taxes);

        uint256 old_taxes = collected_taxes;
        collected_taxes = 0;
        return old_taxes;

    }

    function terminate() public {
        require(msg.sender == creator, "You cannot terminate the contract!");
        selfdestruct(creator);
    }


}