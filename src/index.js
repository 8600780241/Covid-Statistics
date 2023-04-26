const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')

app.get('/totalRecovered', async (req, res) => {
    let result = await connection.aggregate([{
        $group: {
            _id: " $id",
            recovered: { $sum: "$recovered" }
        }
    }
    ]);
    res.send(result);
    console.log(result)
})


app.get('/totalActive', async (req, res) => {

    let result = await connection.aggregate([
        {
            $group: {
                _id: "$id",
                active: {
                    $sum: { $subtract: ['$infected', '$recovered'] }
                }
            }
        }
    ])
    res.send(result)
    console.log(result)
})



app.get('/totalDeath', async (req, res) => {
    let result = await connection.aggregate([{
        $group: {
            _id: " $id",
            totalDeath: { $sum: "$death" }
        }
    }
    ]);
    res.send(result);
    console.log(result)
})

app.get('/hotspotStates', async (req, res) => {
    let result = await connection.aggregate(
        [
            {
                $project:
                {
                    state: "$state",
                    rate: {
                        $cond: {
                            if: {
                                $gte: [
                                    { $round: [{ $divide: [{ $subtract: ['$infected', '$recovered'] }, '$infected'] }, 5] }, 0.1]
                            }, then: null, else: "hotspotState"
                        }
                    }
                }
            }
        ]
    )
    res.send(result);
    console.log(result)
})

app.get('/healthyStates', async (req, res) => {
    let result = await connection.aggregate(
        [
            {
                $project:
                {
                    state: "$state",
                    mortality: {
                        $cond: {
                            if: {
                                $gte: [
                                    { $round: [{ $divide: ['$death', '$infected'] }, 5] }, 0.005]
                            }, then: null, else: "healthyState"
                        }
                    }
                }
            }
        ]
    )
    res.send(result);
    console.log(result)
})
app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;