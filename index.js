import dotenv from 'dotenv';
import express from 'express';
import './Connection/database.js';

dotenv.config();
const app =express()
const port=process.env.PORT || 8080
console.log(process.env)
app.get('/', (req,res)=> {
    res.send('Diveyam')
})
app.listen(port,()=>{
    console.log('hello')
})