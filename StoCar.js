// Set the contract address
var contractAddress = "0xc4140b3fB4087C745dFc193EE509278670F5A92d";
// Where the ABI will be saved
var contractJSON = "build/contracts/StoCar.json"
// Set the sending address
var senderAddress = "0x0";
// Set contract ABI and the contract
var contract = null;

//Initializes JS environment in the index page
async function onLoad_index(){
    await initialise(contractAddress);
    getOpenAuctions(); 
}

async function initialise(contractAddress) {
    // Initialisation of Web3
    
    if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
    } else {
    // Set the provider you want from Web3.providers
    // Use the WebSocketProvider to enable events subscription.
        web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:7545"));
    }

    // Load the ABI. We await the loading is done through "await"
    // More on the await operator: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await
    var myJSON;
    await $.getJSON(contractJSON).then(function( contractData ) { // Use of IIFEs: https://developer.mozilla.org/en-US/docs/Glossary/IIFE
        //console.log(contractData);
        contract = new web3.eth.Contract(contractData.abi, contractAddress);
        console.log("Contract loaded");
    }).catch((error) => { console.error(error); });

    if (!contract) {
    console.error("No contract loaded");
    return false;
    }

    console.log("Finished contract loading, contract: ", contract);
    
    // Set the address from which transactions are sent
    await web3.eth.requestAccounts().then(function(accounts){
        senderAddress = accounts[0];
        console.log("Sender address set: " + senderAddress);
    });
    
    // Create additional event listeners to display the results
    subscribeToEvents();
}

async function openAuction() {
    var description = $('#description').val();
    var starting_price = parseInt($('#starting_price').val());
    var maximum_duration = parseInt($('#maximum_duration').val());
    var chassis_id = $('#chassis_id').val();

    var picture_id = 0 //TO DO INSERTION OF PICTURES
    
    console.log("contract: "+contract);

    contract.methods.openAuction(starting_price, maximum_duration).send({from:senderAddress}).then(function(receipt) {
        console.log(receipt);

        /*
        fetch('http://localhost:5000/auctions/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                "owner_addr": senderAddress,
                "starting_price": starting_price,
                "maximum_duration": maximum_duration,
                "picture_id": picture_id,
                "description": description,
                "chassis_id": chassis_id
            })
        });
        */
    }).catch((err)=>{
        
    });
    document.getElementById('new_auction').outerHTML += "<br><h4>Success!</h4>";
    document.getElementById('new_auction').reset();
}

//Plots all the auctions in a table
async function getOpenAuctions(){

    console.log("contract: "+contract);
    contract.methods.getOpenAuctions().call({from:senderAddress}).then(function(receipt) {
        console.log(receipt);
    });
}

//Plot a single auction
async function getAuction(){
    var url = new URLSearchParams(window.location.search);
    owner_addr = url.get("owner_addr");

    fetch('http://localhost:5000/auction?owner_addr='+owner_addr, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        return response.json()
    }).then((auctions) => {
        auction = auctions[0];
        console.log(auction);

        
        button_participate = '<form action="/participate_auction.html" method="get"> \
                                <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction.owner_addr+'"/> \
                                <input type="submit" value="Participate auction"/> \
                              </form>'

        button_car = '<form action="/car_history.html" method="get"> \
                        <input type="hidden" name="chassis_id" id="chassis_id" value="'+auction.chassis_id+'"/> \
                        <input type="submit" value="Car history"/> \
                      </form>'

        var tr = "<tr>";
        tr += "<td>"+auction.owner_addr+"</td>";
        tr += "<td>"+auction.winner_addr+"</td>";
        tr += "<td>"+auction.chassis_id+"</td>";
        tr += "<td>"+auction.description+"</td>";
        tr += "<td>"+auction.maximum_duration+"</td>";
        tr += "<td>"+auction.picture_id+"</td>";
        tr += "<td>"+auction.starting_price+"</td>";
        tr += "<td>"+button_participate+"</td>";
        tr += "<td>"+button_car+"</td>";
        tr += "</tr>";

        document.getElementById('auction').innerHTML += tr;
    });

    console.log("OWNER_ADDR: "+owner_addr);
}

//Plot a single car
async function getCar(){
    var url = new URLSearchParams(window.location.search);
    chassis_id = url.get("chassis_id");

    fetch('http://localhost:5000/car_history?chassis_id='+chassis_id, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        return response.json()
    }).then((cars) => {
        car = cars[0];
        console.log(car);

        var tr = "<tr>";
        tr += "<td>"+car.owner_addr+"</td>";
        tr += "<td>"+car.winner_addr+"</td>";
        tr += "</tr>";

        document.getElementById('car').innerHTML += tr;
    });
}

async function participateAuction(){
    var url = new URLSearchParams(window.location.search);
    owner_addr = url.get("owner_addr");

    var offer = $('#offer').val();
    
    contract.methods.participateAuction(owner_addr, offer).send({from:senderAddress, value:web3.utils.toWei(offer, "ether")}).then(function(receipt) {
        console.log(receipt);

        fetch('http://localhost:5000/send_offer', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                "owner_addr": owner_addr,
                "winner_addr": senderAddress,
                "offer": offer
            })
        });
    }).catch((err)=>{

    });

}

function subscribeToEvents(){

    contract.events.AuctionOpened( (error, event) => {
            if (error) {
                console.error(error)
            }
            //console.log(event);
		}
	);

    contract.events.TaxChanged((error, event) => {
            if (error) {
                console.error(error)
            }
            //console.log(event);
        }
	);

    contract.events.OfferAccepted((error, event) => {
            if (error) {
                console.error(error)
            }
            console.log(event);
        }
    );

}