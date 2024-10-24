import dotenv from 'dotenv';
import express from 'express';
import './Connection/database.js';

dotenv.config();
const app =express()
console.log(process.env)
app.get('/', (req,res)=> {
    res.send('Diveyam')
})
