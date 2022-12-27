// Set the contract address
var contractAddress = "0xb1Dde836A6fA4B435E131f7CCeb6a1cbD57a0350";
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

    /*
    // Update the information displayed
    updateDisplayedInformation();
    
    */
}

function count() {
    contract.methods.count().call({from:senderAddress}).then(function(result) {
        console.log("Counter request sent.");
    });

    contract.methods.count().send({from:senderAddress}).on('receipt', function(receipt) {
        console.log("Receipt received.");
    });
}

async function openAuction() {
    var description = $('#description').val();
    var starting_price = parseInt($('#starting_price').val());
    var maximum_duration = parseInt($('#maximum_duration').val());

    var picture_id = 0 //TO DO INSERTION OF PICTURES

    contract.methods.openAuction(starting_price, maximum_duration).call({from:senderAddress}).then(function(result) {
        console.log("Counter request sent.");
    });
    
    contract.methods.openAuction(starting_price, maximum_duration).send({from:senderAddress}).on('receipt', function(receipt) {
        console.log("Receipt received.");
    });

    
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
            "description": description
        })
    });
}

function getAuctions(){
    fetch('http://localhost:5000/auctions/', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then((response) => {
        return response.json()
        //$("#list_auctions").html(response);
    }).then((data) => {
        $("#list_auctions").html(data);
    });


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