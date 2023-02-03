// Set the contract address
var contractAddress = "0x4078b860462e00A7CAaAddd632E0012695AcD213";
// Where the ABI will be saved
var contractJSON = "build/contracts/StoCar.json"
// Set the sending address
var senderAddress = "0x0";
// Set contract ABI and the contract
var contract = null;

// Prevent forms from submitting and reloading the page
$("form").submit(function(e){e.preventDefault();});

$(window).on('load', function() {
    initialise(contractAddress);
});


//Initializes JS environment in the index page
async function onLoad_index(){
    await initialise(contractAddress);
    getOpenAuctions(); 
}

async function onLoad_available_auctions(){
    await initialise(contractAddress);
    getOpenAuctions(); 
}

async function onLoad_auction(){
    await initialise(contractAddress);
    getOpenAuction(); 
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
    //var starting_price = parseInt($('#starting_price').val());
    var starting_price = $('#starting_price').val();
    var maximum_duration = parseInt($('#maximum_duration').val());
    var chassis_id = $('#chassis_id').val();
    var picture_id = $('#picture_id').val();
    
    //picture handling
    //var fileInput = document.getElementById('picture_id');
    //var file = fileInput.files[0];

    document.getElementById('new_auction').outerHTML += "<br><h4>Waiting...</h4><h4>Metamask not computing gas? Maybe it's an Operation Not Permitted...</h4>";
    document.getElementById('new_auction').reset();

    contract.methods.openAuction(starting_price, maximum_duration, web3.utils.asciiToHex(chassis_id)).send({from:senderAddress}).then(function(receipt) {
        console.log(receipt);

        document.getElementById('new_auction').outerHTML += "<br><h4>Oh well: Success!</h4>";
        document.getElementById('new_auction').reset();

        fetch('http://localhost:5000/auctions/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                "owner_addr": senderAddress,
                "chassis_id": chassis_id,
                "picture_id": picture_id,
                //"picture_id": file,
                "description": description
            })
        });
        
    }).catch((err)=>{
        console.error(err.message);
    });



    //elisa
    //var fileInput = document.getElementById('picture_id');
    //var file = fileInput.files[0];
    ////////////theoretically file is saved in db
    //var fileDisplayArea = document.getElementById('fileDisplayArea');
    //var imageType = /image.*/;
    /*if (file.type.match(imageType)) {
        var reader = new FileReader();

        reader.onload = function(e) {
            fileDisplayArea.innerHTML = "";

            // Create a new image.
            var img = new Image();
            // Set the img src property using the data URL.
            img.src = reader.result;

            // Add the image to the page.
            fileDisplayArea.appendChild(img);
        }
        reader.readAsDataURL(file); 
    } else {
        fileDisplayArea.innerHTML = "File not supported!";
    }*/

    /* //pictures anna
    const inputElement = document.getElementById("picture_id");
    const image = inputElement.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.addEventListener('load', () => {
        const imagesArray = localStorage.getItem('images'); 
        let images = [];

        if (imagesArray) {
            images = [...JSON.parse(imagesArray)];

            images.push(reader.result);
        } else {
            images.push(reader.result);
        }

        localStorage.setItem(chassis_id, JSON.stringify(images));
    });*/

    //document.getElementById('new_auction').outerHTML += "<br><h4>Waiting...</h4><h4>Metamask not computing gas? Maybe it's an Operation Not Permitted...</h4>";
    //document.getElementById('new_auction').innerHTML += "<br><h4>Waiting...</h4><h4>Metamask not working as exprected? You sure you can do this operation?</h4>";
    //document.getElementById('new_auction').reset();

}

/*???????
document.getElementById("picture_id").addEventListener('change',(event)=>{
        const image=event.target.files[0];
        const reader=new FileReader();
        reader.readAsDataURL(image);
        reader.addEventListener('load', ()=>{
            localStorage.setItem('image',reader.result);
        })
    });
*/

async function printTax(){
    //print fixed tax
    contract.methods.getTax().call({from:senderAddress}).then(function(tax){
        console.log(tax);
        document.getElementById('tax').outerHTML += tax+" Wei";
        //document.getElementById('tax').outerHTML += (tax/1e18)+" ETH";
        document.getElementById('tax').disabled = true
        document.getElementById('tax').reset();
    }).catch((err)=>{
        console.error(err);
    });
}

async function loadPictures(){
    var j=1;
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
        //for(let i = auctions.length-1; i>auctions.length-5; i--){ //le più recenti
        i=0
            console.log(auctions[i]);
            var auction = auctions[i];
            document.getElementById('slide'+j).setAttribute('alt',auction.chassis_id);
            var dataImage=localStorage.getItem('images');
            bannerImg=document.getElementById('slide'+j)
            bannerImg.setAttribute('src','data:image/png;base64,'+dataImage); //COSÌ FUNZIONA MA NON CARICA IMG, WHY?
            
            //j++;

        //}
    });
}

//Plots all the auctions in a table
async function getOpenAuctions(){
    //console.log("contract: "+contract); pretty useless, it's just an object

    //object.addEventListener("load", printTax());

    contract.methods.getOpenAuctions().call({from:senderAddress}).then(function(auctions) {
        for(let i = 0; i < auctions.length; i++){
            auction = auctions[i];
            ownerAddr = auction.owner
            if(ownerAddr == 0){
                continue;
            }
            console.log(auction)

            if(auction.owner != senderAddress){
                button_participate = '<form action="/auction.html" method="get"> \
                                        <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction.owner+'"/> \
                                        <input type="submit" value="See auction"/> \
                                    </form>'
            }else {//change it into close auction button
                button_participate = '<form action="/close_auction.html" method="get"> \
                                    <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction.owner+'"/> \
                                    <input type="submit" value="Close auction"/> \
                                </form>'
            }
            

            button_car = '<form action="/car_history.html" method="get"> \
                            <input type="hidden" name="chassis_id" id="chassis_id" value="'+auction.chassis_id+'"/> \
                            <input type="submit" value="Car history"/> \
                        </form>'

            var tr = "<tr>";
            //tr += "<td>"+auction.owner+"</td>";
            if(auction.current_winner == 0){
                tr += "<td>"+"none so far"+"</td>";
            }else{
                tr += "<td>"+auction.current_winner+"</td>";
            }
            tr += "<td>"+(auction.duration-auction.start_timestamp)/3600+"h</td>";
            tr += "<td>"+(auction.starting_price)+" Wei</td>";
            tr += "<td>"+(auction.offer)+" Wei</td>";
            tr += "<td>"+"pippoplutopaperino"+"</td>";
            tr += "<td>"+button_participate+"</td>";
            tr += "<td>"+button_car+"</td>";
            tr += "</tr>";

            document.getElementById('list_auctions').innerHTML += tr;
            /*//find in db
            //fetch('http://localhost:5000/auction?owner_addr='+auction.owner+'&chassis_id='+auction.chassis_id, {
            fetch('http://localhost:5000/auctions?owner_addr='+ownerAddr, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                return response.json()
            }).then((auctions) => {
                auction_db = auctions[0];

                button_participate = '<form action="/auction.html" method="get"> \
                                        <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction.owner+'"/> \
                                        <input type="submit" value="See auction"/> \
                                    </form>'

                button_car = '<form action="/car_history.html" method="get"> \
                                <input type="hidden" name="chassis_id" id="chassis_id" value="'+auction.chassis_id+'"/> \
                                <input type="submit" value="Car history"/> \
                            </form>'

                var tr = "<tr>";
                tr += "<td>"+auction.owner+"</td>";
                tr += "<td>"+auction.current_winner+"</td>";
                tr += "<td>"+(auction.duration-auction.start_timestamp)/3600+"</td>";
                tr += "<td>"+auction.offer+"</td>";
                tr += "<td>"+auction_db.description+"</td>";
                tr += "<td>"+button_participate+"</td>";
                tr += "<td>"+button_car+"</td>";
                tr += "</tr>";

                document.getElementById('list_auctions').innerHTML += tr;
            });*/
        }

    }).catch((err)=>{
        console.log(err);
    });
}

//Plot a single auction
async function getOpenAuction(){
    var url = new URLSearchParams(window.location.search);
    owner_addr = url.get("owner_addr");

    contract.methods.getOpenAuction(owner_addr).call({from:senderAddress}).then(function(auction) {
        console.log(web3.utils.toAscii(auction.car.chassis_id));

        button_participate = '<form action="/participate_auction.html" method="get"> \
                                <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction.owner+'"/> \
                                <input type="submit" value="Participate auction"/> \
                              </form>'

        button_car = '<form action="/car_history.html" method="get"> \
                        <input type="hidden" name="chassis_id" id="chassis_id" value="'+auction.car.chassis_id+'"/> \
                        <input type="submit" value="Car history"/> \
                      </form>'

        var tr = "<tr>";
        //tr += "<td>"+auction.owner+"</td>";
        tr += "<td>"+auction.current_winner+"</td>";
        //tr += "<td>"+web3.utils.toAscii(auction.car.chassis_id)+"</td>";
        //tr += "<td>"+auction.description+"</td>";
        tr += "<td>"+(auction.duration-auction.start_timestamp)/3600+"</td>";
        //tr += "<td>"+auction.picture_id+"</td>";
        tr += "<td>"+auction.starting_price+"</td>";
        tr += "<td>"+auction.offer+"</td>";
        tr += "<td>"+button_participate+"</td>";
        tr += "<td>"+button_car+"</td>";
        tr += "</tr>";

        document.getElementById('auction').innerHTML += tr;
    });
    
    fetch('http://localhost:5000/auctions?owner_addr='+owner_addr, {
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
        //per ora non lo esegue mai poi vedere se i campi sono corretti (quando mai funzionerà il db)
        var tr = "<tr>";
        tr += "<td>"+auction.owner_addr+"</td>";
        tr += "<td>"+auction.winner_addr+"</td>";
        tr += "<td>"+auction.chassis_id+"</td>";
        tr += "<td>"+auction.description+"</td>";
        tr += "<td>"+auction.maximum_duration+"</td>";
        tr += "<td>"+auction.picture_id+"</td>";
        tr += "<td>"+auction.offer+"</td>";
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
    var offer = $('#offer').val(); //Wei
    
    //contract.methods.participateAuction(owner_addr, offer).send({from:senderAddress, value:web3.utils.toWei(offer, "ether")}).then(function(receipt) {
    contract.methods.participateAuction(owner_addr, offer).send({from:senderAddress, value:offer}).then(function(receipt) {
        console.log(receipt);
        
        /* DA TOGLIERE
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
        */
        
    }).catch((err)=>{
        console.error(err.message);
    });

}

async function closeAuction(){
    var url = new URLSearchParams(window.location.search);

    owner_addr = url.get("owner_addr");
    document.getElementById('close_auction').outerHTML += "<br><h4>Wait...Do you really want to close the auction?</h4>";
    contract.methods.closeAuction(owner_addr).send({from:senderAddress}).then(function(receipt) {
        console.log("Auction Closed: "+receipt);
        document.getElementById('close_auction').outerHTML += "<br><h4>Oh well, you succeeded: The auction is now closed!</h4>";
        document.getElementById('close_auction').reset();        
    }).catch((err)=>{
        console.log("Close Auction failed: "+err.message);
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
