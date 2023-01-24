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
app.get("/auction", async(req,res)=>{
    try{
        const owner_addr = req.query.owner_addr;
        
        const getAuction = await pool.query("SELECT * FROM auctions WHERE owner_addr = $1", [owner_addr]);
        res.json(getAuction.rows);
    }
    catch(err){
        console.error(err.message);
    }
});


//CREATE AN AUCTION
app.post("/auctions", async(req,res) => {
    try{
        const {owner_addr, starting_price, maximum_duration, picture_id, description, chassis_id} = req.body;
        var car = await pool.query("SELECT chassis_id FROM cars WHERE chassis_id = $1", [chassis_id]);
        if(car.rowCount == 0){
            await pool.query("INSERT INTO cars (chassis_id) VALUES ($1)", [chassis_id]);
        }

        await pool.query("INSERT INTO auctions (owner_addr, starting_price, maximum_duration, picture_id, description, chassis_id) VALUES ($1, $2, $3, $4, $5, $6)", [owner_addr, starting_price, maximum_duration, picture_id, description, chassis_id]);
    }
    catch (err){
        console.error(err.message);
    }
});

//DELETE AN AUCTION

app.listen(5000, () => {
    console.log("Server is listening on on port 5000")
})

