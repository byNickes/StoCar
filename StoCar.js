// Set the contract address
var contractAddress = "0xc565be0811Ad900cc6655A65d8ee93D6e8EA8e9c";
// Where the ABI will be saved
var contractJSON = "build/contracts/StoCar.json"
// Set the sending address
var senderAddress = "0x0";
// Set contract ABI and the contract
var contract = null;

//Initializes the JS environment
$(window).on('load', function() {
    initialise(contractAddress);
});

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
    await $.getJSON(contractJSON,
    function( contractData ) { // Use of IIFEs: https://developer.mozilla.org/en-US/docs/Glossary/IIFE
        // console.log(contractAbi);
        contract = new web3.eth.Contract(contractData.abi, contractAddress);
    }).catch((error) => { console.error(error); });

    if (!contract) {
    console.error("No contract loaded");
    return false;
    }
    
    // Set the address from which transactions are sent
    web3.eth.requestAccounts().then(function(accounts){
        senderAddress = accounts[0];
        console.log("Sender address set: " + senderAddress);
    });

    // Subscribe to all events by the contract
    contract.events.allEvents( (error, event) => {
        if (error) {
            console.error(error)
        }
        console.log(event);
    });
    
    
    // Create additional event listeners to display the results of a play.
    subscribeToEvents();
}

async function openAuction() {
    var description = $('#description').val();
    var starting_price = parseInt($('#starting_price').val());
    var maximum_duration = parseInt($('#maximum_duration').val());
    var chassis_id = $('#chassis_id').val();

    var picture_id = 0 //TO DO INSERTION OF PICTURES

    /*
    contract.methods.openAuction(starting_price, maximum_duration).call({from:senderAddress}).then(function(result) {
        console.log("Counter request sent.");
    });
    
    contract.methods.openAuction(starting_price, maximum_duration).send({from:senderAddress}).on('receipt', function(receipt) {
        console.log("Receipt received.");
    });
    */
    
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
}

//Plots all the auctions in a table
async function getAuctions(){
    fetch('http://localhost:5000/auctions/', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        return response.json()
    }).then((auctions) => {
        console.log(auctions)

        for(let i = 0; i<auctions.length; i++){
            console.log(auctions[i])
            auction = auctions[i];

            button = '<form action="/auction.html" method="get"> \
                        <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction.owner_addr+'"/> \
                        <input type="submit" value="View auction"/> \
                      </form>'

            console.log(button)

            var tr = "<tr>";
            tr += "<td>"+auction.owner_addr+"</td>";
            tr += "<td>"+auction.chassis_id+"</td>";
            tr += "<td>"+auction.description+"</td>";
            tr += "<td>"+auction.maximum_duration+"</td>";
            tr += "<td>"+auction.picture_id+"</td>";
            tr += "<td>"+auction.starting_price+"</td>";
            tr += "<td>"+button+"</td>";
            tr += "</tr>";
            
            document.getElementById('list_auctions').innerHTML += tr;
        }
    });
}

//Plot a single auction
async function getAuction(){
    var url = new URLSearchParams(window.location.search);
    owner_addr = url.get("owner_addr");

    console.log("OWNER_ADDR: "+owner_addr);
}

function subscribeToEvents(){

    contract.events.AuctionOpened( (error, event) => {
            if (error) {
                console.error(error)
            }
            console.log(event);
		}
	);

    contract.events.TaxChanged((error, event) => {
            if (error) {
                console.error(error)
            }
            console.log(event);
        }
	);

}