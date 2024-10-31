import dotenv from 'dotenv';
import connectDB from './Connection/database.js';
import { app, server } from './app.js';

dotenv.config();

const port=process.env.PORT || 8080

connectDB()
.then(()=>{
    server.listen(port,()=>{
        console.log('Server running');
    })
})
.catch((err) => {
    console.log("Mongo Error",err);
})

app.get('/',(req,res)=> {
    res.send('Diveyam')
})