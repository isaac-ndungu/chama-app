import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './db.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port http://localhost:${PORT}`);
    });
};

start();