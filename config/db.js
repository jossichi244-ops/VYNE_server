const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            `${process.env.MONGO_CONNECTION}/${process.env.mongo_db}`,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );
        console.log(`MongoDB connected successfully`);
    }
    catch (error){
        console.error("DBS connection errer:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;
