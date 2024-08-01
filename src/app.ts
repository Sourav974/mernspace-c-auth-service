import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import logger from "./config/logger";
import { HttpError } from "http-errors";
import authRouter from "./routes/auth";

const app = express();
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

app.get("/", async (req, res) => {
    res.status(200).send("Welcome to auth service!!");
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message);
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: "",
                location: "",
            },
        ],
    });
});

app.use("/auth", authRouter);

export default app;
