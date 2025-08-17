import mongoose from 'mongoose'

export async function connectDatabase(uri) {
  const mongoUri = 'mongodb+srv://code14899:123password123@cluster0.eg89drq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
  mongoose.set('strictQuery', true)
  await mongoose.connect(mongoUri)
  return mongoose.connection
}

