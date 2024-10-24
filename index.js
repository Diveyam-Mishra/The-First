import dotenv from 'dotenv';
import express from 'express';
import './Connection/database.js';

dotenv.config();
const app =express()
const port=3000

app.get('/', (req,res)=> {
    res.send('Diveyam')
})
app.listen(port,()=>{
    console.log('hello')
})