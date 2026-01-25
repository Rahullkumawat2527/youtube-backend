import dotenv from "dotenv"
dotenv.config()
import connectDB from "./db/index.js";
import { app } from "./app.js"


const PORT = process.env.PORT || 8000

process.on("uncaughtException", err => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
  console.error("UNHANDLED PROMISE REJECTION:", err);
});

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("error while connecting express to mongo db", error)
            throw error
        })
        app.listen(PORT, () => {
            console.log(`Server is running on port : ${PORT}`)
        })
    })
    .catch((error) => {
        console.log("Mongo db connection failed !!! ", error)
    })

