import express from 'express';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import userRoutes from './routes/api/userRoutes.js'
import connectDB from './config/connectDB.js';
import corsOptions from './config/corsOptions.js';
import credential from './middlewares/credential.js';

dotenv.config();
const app = express();
connectDB();

// middlewares
app.use(credential);
app.use(cors(corsOptions));
app.use( bodyParser.json() );
app.use( cookieParser() );

// routes
app.use('/user' , userRoutes );

mongoose.connection.once('open' , () => {
    console.log('Connected to DB')
    const port = process.env.PORT;
    app.listen(port , () => console.log(`Server Is Running On Port: ${port}`));
});