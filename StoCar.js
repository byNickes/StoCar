// Set the contract address
var contractAddress = "0xE20C03FDCdcBC6d715b3E166101D3456bF500928";
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

async function onLoad_history(){
    await initialise(contractAddress);
    getCar(); 
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
    var starting_price = $('#starting_price').val();
    var maximum_duration = parseInt($('#maximum_duration').val());
    var chassis_id = $('#chassis_id').val();
    var picture_id = $('#picture_id').val();
    
    //picture handling
    var fileInput = document.getElementById('picture_id');
    var file = fileInput.files[0];
    var reader = new FileReader();
    reader.onload = function() {
        localStorage.setItem(picture_id, reader.result);
    }
    reader.readAsDataURL(file); 

    document.getElementById('new_auction').outerHTML += "<br><h4>Waiting...</h4><h4>Metamask not computing gas? Maybe it's an Operation Not Permitted...</h4>";

    console.log("out");
    contract.methods.openAuction(starting_price, maximum_duration, web3.utils.asciiToHex(chassis_id)).send({from:senderAddress}).then(function(receipt) {
        console.log(receipt);

        document.getElementById('new_auction').outerHTML += "<br><h4>Oh well: Success!</h4>";

        fetch('http://localhost:5000/auction/'+senderAddress+'&'+web3.utils.asciiToHex(chassis_id), {
                        method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                //console.log("RESPONSE IS "+response);
                return response.json()
            }).then((auctions) => {
                console.log("AUCTIONS ARE "+auctions.length);
                if(auctions.length > 0){
                    //update an auction
                    fetch('http://localhost:5000/update_auction/', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            "owner_addr": senderAddress,
                            "chassis_id_hex": web3.utils.asciiToHex(chassis_id),
                            "chassis_id": chassis_id,
                            "picture_id": picture_id,
                            "description": description
                        })
                    });
                    console.log("UPDATED");
                }
                else{
                    //new auction
                    fetch('http://localhost:5000/auction/', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            "owner_addr": senderAddress,
                            "chassis_id_hex": web3.utils.asciiToHex(chassis_id),
                            "chassis_id": chassis_id,
                            "picture_id": picture_id,
                            "description": description
                        })
                    });
                    console.log("NEW CREATED");
                }
        });
        
    }).catch((err)=>{
        console.log(err);
        console.error(err.message);
    });


    //prova stampa DA TOGLIERE
    //var fileDisplayArea = document.getElementById('for_img');
    //var imageType = /image.*/;
    /*if (file.type.match(imageType)) {
        var reader = new FileReader();

        reader.onload = function(e) {
            fileDisplayArea.innerHTML = "";

            // Create a new image.
            var img = new Image();
            // Set the img src property using the data URL.
            img.src = reader.result;
            localStorage.setItem(picture_id, img.src);
            console.log("beginning is "+localStorage.getItem(picture_id));

            // Add the image to the page.
            fileDisplayArea.appendChild(img);

        }
        reader.readAsDataURL(file); 
    } else {
        fileDisplayArea.innerHTML = "File not supported!";
    }*/

   

}

async function printTax(){
    //print fixed tax
    contract.methods.getTax().call({from:senderAddress}).then(function(tax){
        //console.log(tax);
        if(document.getElementById('starting_price')!=null){
            document.getElementById('starting_price').outerHTML += "<h6 style='font-style: oblique; padding-top:3px;'>"+"Fixed Tax is "+tax+" Wei"+"</h6>";
        }
        else{
        document.getElementById('tax').outerHTML += "<p style='font-style: oblique; padding-top:2px;'>"+tax+" Wei"+"</p>";
        //document.getElementById('tax').outerHTML += (tax/1e18)+" ETH";
        document.getElementById('tax').disabled = true
        //document.getElementById('tax').reset();
        console.log(document.getElementById('starting_price'));
        }
    }).catch((err)=>{
        console.error(err);
    });
}

async function changeTax(){
    var new_tax = $('#new_tax').val();
    
    contract.methods.getCreator().call({from:senderAddress}).then(function(creator){
        console.log("THE CREATOR IS "+creator);
        if(creator == senderAddress){
            //change fixed tax
            contract.methods.changeFixedTax(new_tax).send({from:senderAddress}).then(function(receipt){
                console.log("TAX CHANGED in "+new_tax);
                document.getElementById('change_tax').innerHTML += "You changed the tax!";
            }).catch((err)=>{
                console.error(err);
            });
        }
        else{
            document.getElementById('change_tax').innerHTML += "You are not the creator! You cannot change the tax.";
        }
    }).catch((err)=>{
        console.error(err);
    });

}

async function withdraw(){

    contract.methods.getCreator().call({from:senderAddress}).then(function(creator){
        console.log("THE CREATOR IS "+creator);
        if(creator == senderAddress){
            //print fixed tax
            contract.methods.withdraw().send({from:senderAddress}).then(function(withdrawn){
                console.log(withdrawn);
                document.getElementById('withdraw').outerHTML += "Correctly Withdrawn! how much????"; //add how much, variable withdrawn
                //document.getElementById('tax').outerHTML += (tax/1e18)+" ETH";
                document.getElementById('withdraw').disabled = true
                //document.getElementById('tax').reset();
            }).catch((err)=>{
                console.error(err);
            });
        }else{
            console.log("NOT THE CREATOR");
            document.getElementById('withdraw').outerHTML += "You cannot withdraw!";
            document.getElementById('withdraw').disabled = true
        }

    }).catch((err)=>{
        console.error(err);
    });

}

async function loadPictures(open_pictures_id,open_pictures_desc){
    console.log(open_pictures_id);
    console.log(open_pictures_desc);
    if(open_pictures_id.length>0){
    
        var j=1;
        while(j<=open_pictures_id.length){
            //console.log("Slide "+j);
            var es=document.getElementById('slide'+j);
            es.style="border: 1px none #000";

            var img = new Image();
            var result = localStorage.getItem(open_pictures_id[j-1]); 
            img.src = result;
            img.style="float:left; margin:10px; margin-top:30px; width:30%";
            es.appendChild(img);

            es.innerHTML += "<h2>It's currently available!</h2><h3 style='margin-top:10px;'>Description:</h3><p style='font-weight: bold;color:rgb(0, 0, 0); font-style: oblique; padding-top:40px; font-size:30px;'>"+open_pictures_desc[j-1]+"</p>"; //perchè console continua a dare errore ma funziona?
            j++;
        }
    }
}

//Plots all the auctions in a table
async function getOpenAuctions(){
    let trs = [];
    //get open auctions and relative information from db
    contract.methods.getOpenAuctions().call({from:senderAddress}).then(function(auctions) {
        //print everything on screen
        console.log("Auction aperte sono "+auctions.length);
        var array_openAuction_id=new Array(auctions.length);
        var array_openAuction_desc=new Array(auctions.length);
        for(let i = 0; i < auctions.length; i++){
            auction = auctions[i];
            ownerAddr = auction.owner;
            if(ownerAddr == 0){
                continue;
            }
            console.log(auction);

            trs[i] = "<tr>";
            if(auction.current_winner == 0){
                trs[i] += "<td>"+"none so far"+"</td>";
            }else{
                trs[i] += "<td>"+auction.current_winner+"</td>";
            }
            //print time
            let dateObj = new Date(auction.duration * 1000);
            let utcString = dateObj.toUTCString();
            trs[i] += "<td>"+utcString+"</td>";
            //trs[i] += "<td>"+(auction.duration-auction.start_timestamp)/3600+"h</td>";
            trs[i] += "<td>"+(auction.starting_price)+" Wei</td>";
            trs[i] += "<td>"+(auction.offer)+" Wei</td>";
            
            console.log("TYPE IS "+typeof auction.car.chassis_id);
            console.log("hex chassis before "+auction.car.chassis_id);
            
            //find in db
            fetch('http://localhost:5000/auction/'+auction.owner+'&'+auction.car.chassis_id, {
                        method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                console.log("RESPONSE IS "+response);
                return response.json()
            }).then((auctions_db) => {
                console.log("AUCTIONS ARE "+auctions_db.length);
                if(auctions_db.length > 0){
                    auction_db = auctions_db[0];
                    
                    array_openAuction_id[i]=auction_db.picture_id;
                    array_openAuction_desc[i]=auction_db.description;
                    
                    console.log(array_openAuction_id);
                    console.log(array_openAuction_desc);
                    
                    
                    //print images
                    var img = new Image();
                    var result = localStorage.getItem(auction_db.picture_id);
                    //console.log("for picture: "+auction_db.picture_id+" --> the EXTRACTED IS "+result);
                    img.src = result;
                    img.style = "padding:10px;"
                    document.getElementById('list_auctions').appendChild(img);

                    //console.log("owner db "+auction_db.owner_addr+" vs sender "+senderAddress);
                    if(auction_db.owner_addr != senderAddress){
                        button_participate = '<form action="/auction.html" method="get"> \
                                                <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction_db.owner_addr+'"/> \
                                                <input type="submit" class="button" value="See auction"/> \
                                            </form>'
                    }else {//change it into close auction button
                        button_participate = '<form action="/close_auction.html" method="get"> \
                                            <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction_db.owner_addr+'"/> \
                                            <input type="submit" class="button" value="Close auction"/> \
                                        </form>'
                    }
                    
        
                    button_car = '<form action="/car_history.html" method="get" onsubmit = "getCar();"> \
                                    <input type="hidden" name="chassis_id" id="chassis_id" value="'+auction_db.chassis_id+'"/> \
                                    <input type="submit" class="button" value="Car history"/> \
                                </form>'
        
                    trs[i] += "<td>"+auction_db.chassis_id+"</td>";
                    trs[i] += "<td>"+(auction_db.description)+"</td>";
                    trs[i] += "<td>"+button_participate+"</td>";
                    trs[i] += "<td>"+button_car+"</td>";
                    trs[i] += "</tr>";

                    document.getElementById('list_auctions').innerHTML += trs[i];
                    //document.getElementById('list_auctions').appendChild(img);
                    if(i==auctions.length-1){
                        loadPictures(array_openAuction_id, array_openAuction_desc);
                    }
                }
                
            });
            
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

        fetch('http://localhost:5000/auction/'+auction.owner+'&'+auction.car.chassis_id, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            console.log("RESPONSE IS "+response);
            return response.json()
        }).then((auctions) => {
            console.log("AUCTIONS ARE "+auctions.length);
            if(auctions.length > 0){
                auction_db = auctions[0];
                console.log("Picture is "+auction_db.picture_id);

                //print images
                var img = new Image();
                var result = localStorage.getItem(auction_db.picture_id);
                //console.log("for picture: "+auction_db.picture_id+" --> the EXTRACTED IS "+result);
                img.src = result;
                img.style="padding:10px;";

                console.log("owner db "+auction_db.owner_addr+" vs sender "+senderAddress);
                if(auction_db.owner_addr != senderAddress){
                    button_participate = '<form action="/participate_auction.html" method="get"> \
                                            <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction.owner+'"/> \
                                            <input type="submit" class="button" value="Make an offer"/> \
                                        </form>'
                }else {//change it into close auction button
                    button_participate = '<form action="/close_auction.html" method="get"> \
                                        <input type="hidden" name="owner_addr" id = "owner_addr" value="'+auction.owner+'"/> \
                                        <input type="submit" class="button" value="Close auction"/> \
                                    </form>'
                }
                
                button_car = '<form action="/car_history.html" method="get"> \
                                <input type="hidden" name="chassis_id" id="chassis_id" value="'+auction_db.chassis_id+'"/> \
                                <input type="submit" class="button" value="Car history"/> \
                            </form>'
    
                var tr = "<tr>";
                tr += "<td>"+auction_db.chassis_id+"</td>";
                //tr += "<td>"+auction.owner+"</td>";
                if(auction.current_winner == 0){
                    tr += "<td>"+"none so far"+"</td>";
                }else{
                    tr += "<td>"+auction.current_winner+"</td>";
                }
                //print time
                let dateObj = new Date(auction.duration * 1000);
                let utcString = dateObj.toUTCString();
                tr += "<td>"+utcString+"</td>";
                //tr += "<td>"+(auction.duration-auction.start_timestamp)/3600+"h</td>";
                tr += "<td>"+(auction.starting_price)+" Wei</td>";
                tr += "<td>"+(auction.offer)+" Wei</td>";
                tr += "<td>"+(auction_db.description)+"</td>";
                tr += "<td>"+button_participate+"</td>";
                tr += "<td>"+button_car+"</td>";
                tr += "</tr>";

                document.getElementById('auction').innerHTML += tr;
                document.getElementById('auction').appendChild(img);
            }
        });

    });
    
}

//Plot a single car
async function getCar(){
    var url = new URLSearchParams(window.location.search);
    chassis_id = url.get("chassis_id");
    console.log("IN FOR CHASSIS ID = "+chassis_id);

    contract.methods.getCarHistory(web3.utils.asciiToHex(chassis_id)).call({from:senderAddress}).then(function(contract_auctions) {
        console.log("IN HISTORY AUCTIONS FROM CONTRACT ARE "+contract_auctions.length);

        fetch('http://localhost:5000/car_history/'+chassis_id, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            return response.json()
        }).then((auctions) => {
            console.log("CARS ARE "+auctions.length);
            for(let i = 0; i < auctions.length; i++){
                auction = auctions[i];
                console.log(auction);

                //compute right index
                var index = 0;
                for(let j = 0; j < contract_auctions.length; j++){
                    if(contract_auctions[j].owner == auction.owner_addr){
                        index = j;
                        break;
                    }
                }

                //print image
                var img = new Image();
                var result = localStorage.getItem(auction.picture_id);
                //console.log("for picture: "+auction_db.picture_id+" --> the EXTRACTED IS "+result);
                img.src = result;
                img.style="padding: 10px;"
                document.getElementById('car').appendChild(img);

                var tr = "<tr>";
                tr += "<td>"+auction.owner_addr+"</td>";
                if(contract_auctions[index].current_winner == 0){
                    tr += "<td>"+"not yet sold"+"</td>";
                }
                else{ tr += "<td>"+contract_auctions[index].current_winner+"</td>"; }
                tr += "<td>"+auction.chassis_id+"</td>";
                tr += "<td>"+contract_auctions[index].offer+"</td>";
                tr += "</tr>";

                console.log("FOR J="+index+" the contract auction is "+contract_auctions[index]);

                document.getElementById('car').innerHTML += tr;
            }
        });
    }).catch((err)=>{
        console.log(err);
        console.error(err.message);
    });
}

async function participateAuction(){
    var url = new URLSearchParams(window.location.search);
    owner_addr = url.get("owner_addr");
    var offer = $('#offer').val(); //Wei
    
    //contract.methods.participateAuction(owner_addr, offer).send({from:senderAddress, value:web3.utils.toWei(offer, "ether")}).then(function(receipt) {
    contract.methods.participateAuction(owner_addr, offer).send({from:senderAddress, value:offer}).then(function(receipt) {
        console.log(receipt);

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
        //document.getElementById('close_auction').reset();        
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
            //console.log(event);
        }
    );

    //DA TOGLIERE
    contract.events.Withdrawn((error, event) => {
        if (error) {
            console.error(error)
        }
        //console.log("WITHDRAWN EVENT "+event);
    }
);

}
