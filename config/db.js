import mongoose from "mongoose";

let cached = global.mongoose;

if(!cached){
     cached = global.mongoose = {conn:null , promise : null}
}

async function connectDB(){
    if(cached.conn){
        return cached.conn
    }

    if(!cached.promise){
        const opts = {
            bufferCommands : false,
            serverSelectionTimeoutMS: 5000, // 5 seconds
            maxPoolSize: 10,        // cap connections PER app instance (Mongoose default is 100)
            minPoolSize: 2,         // KEEP 2 connections warm so we never pay a cold Atlas
                                    // reconnect (DNS+TLS+auth) on the next request after idle —
                                    // this is what was causing the 18s "burst" latencies
            maxIdleTimeMS: 300000,  // only retire pooled sockets ABOVE minPoolSize after 5 min
            socketTimeoutMS: 45000,
        }

        cached.promise=mongoose.connect(`${process.env.MONGODB_URI}/ECommerce`,opts).then(mongoose =>{
            return mongoose
        })
    }

    try {
        cached.conn = await cached.promise
    } catch (error) {
        cached.promise = null  // reset so a failed connection can be retried on the next request
        throw error
    }
    return cached.conn;
}



export default connectDB