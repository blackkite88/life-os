import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.warn("⚠️ MONGO_URI is not set! Using in-memory fallback for local dev if Mongoose isn't configured, but multi-tenant requires a DB.");
      return;
    }
    
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
}
