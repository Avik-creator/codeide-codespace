import mongoose from "mongoose";
export const config = {
  matcher: "/:path*",
  runtime: "nodejs",
  unstable_allowDynamic: [
    // allows a single file
    "/src/db/lib/dbConnect.js",
    // use a glob to allow anything in the function-bind 3rd party module
    "/node_modules/mongoose/dist/**",
  ],
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL!);
    console.log(`Successfully connected to mongoDB 🥂`);
  } catch {
    console.error(`Error: Unable to connect to mongoDB 🚨`);
    process.exit(1);
  }
};

export default connectDB;
