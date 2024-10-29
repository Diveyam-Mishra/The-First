import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerSpec from './swagger.js';
import swaggerUI from 'swagger-ui-express';
import workingRouter from './Routes/auth.routes.js';
const app = express();

app.use(cors())
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/users", workingRouter);

export {app}