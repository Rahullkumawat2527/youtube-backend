import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js"

dotenv.config({
    path: "./.env"
})

const PORT = process.env.PORT || 8000

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("error while connecting express to mongo db",error)
            throw error
        })
        app.listen(PORT, () => {
            console.log(`Server is running on port : ${PORT}`)
        })
    })
    .catch((error) => {
        console.log("Mongo db connection failed !!! ", error)
    })

