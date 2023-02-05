const express = require("express");
const Pool = require("pg").Pool;
const cors = require("cors");

const app = express();
const pool = new Pool({
    user:"stocar",
    password: "stocar",
    database: "StoCar",
    host: "localhost",
    port: "5432"
})

app.use(express.json());
app.use(cors());

//ROUTES//
//TUTORIAL: https://www.youtube.com/watch?v=_Mun4eOOf2Q

//GET AUCTIONS
app.get("/auctions", async(req,res) => {
    try{
        const {owner_addr} = req.body;
        const getAuctions = await pool.query("SELECT * FROM auctions");
        res.json(getAuctions.rows);
    }
    catch (err){
        console.error(err.message);
    }
});

//GET AN AUCTION
app.get("/auction/:owner_addr&:chassis_id_hex", async(req,res)=>{
    try{
        const owner_addr = req.params.owner_addr;
        const chassis_id_hex = req.params.chassis_id_hex;

        const getAuction = await pool.query("SELECT * FROM auctions WHERE owner_addr = $1 and chassis_id_hex = $2", [owner_addr, chassis_id_hex]);
        res.json(getAuction.rows);
    }
    catch(err){
        console.error(err.message);
    }
});


//CREATE AN AUCTION
app.post("/auctions", async(req,res) => {
    try{
        const {owner_addr, chassis_id_hex, chassis_id, picture_id, description} = req.body;
        var car = await pool.query("SELECT chassis_id FROM cars WHERE chassis_id = $1", [chassis_id]);
        if(car.rowCount == 0){
            await pool.query("INSERT INTO cars (chassis_id) VALUES ($1)", [chassis_id]);
        }

        await pool.query("INSERT INTO auctions (owner_addr, chassis_id_hex, chassis_id, picture_id, description) VALUES ($1, $2, $3, $4, $5)", [owner_addr, chassis_id_hex, chassis_id, picture_id, description]);
    }
    catch (err){
        console.error(err.message);
    }
});

/* //UPDATE STARTING_PRICE AND WINNER_ADDR OF AN AUCTION
app.post("/send_offer", async(req,res)=>{
    try{
        const{owner_addr, winner_addr, offer} = req.body;
        
        await pool.query("UPDATE auctions SET starting_price = $1, winner_addr = $2 WHERE owner_addr = $3", [offer, winner_addr, owner_addr]);
    }
    catch(err){
        console.error(err.message);
    }
});*/

//DELETE AN AUCTION (TODO)

//GET A CAR
app.get("/car_history/:chassis_id", async(req,res)=>{
    try{
        const chassis_id = req.params.chassis_id;

        const getCar = await pool.query("SELECT * FROM auctions WHERE chassis_id = $1", [chassis_id]);
        res.json(getCar.rows);
    }
    catch(err){
        console.error(err.message);
    }
});

app.listen(5000, () => {
    console.log("Server is listening on on port 5000")
})
