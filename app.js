import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerSpec from './swagger.js';
import swaggerUI from 'swagger-ui-express';
import workingRouter from './Routes/Auth.js';
const app = express();

app.use(cors())
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
app.use(express.json({limit:"24kb"}))
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

app.use('/', workingRouter);

export {app}