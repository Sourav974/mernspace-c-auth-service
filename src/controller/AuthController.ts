import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { AuthRequest, LoginUserRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";

import { validationResult } from "express-validator";

import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";
// import { error } from "console";

export class AuthController {
    // Dependency Injections
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        // Validation
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, email, password } = req.body;

        this.logger.debug("New request to register a user", {
            firstName,
            lastName,
            email,
            password: "**********",
        });

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });

            this.logger.info("User has been registered", { id: user.id });

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            // generate the access token
            const accessToken = this.tokenService.generateAccessToken(payload);

            // Persist the refresh token
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            res.cookie("accessToken", accessToken, {
                domain: "localHost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60,
                httpOnly: true, // very important
            });

            res.cookie("refreshToken", refreshToken, {
                domain: "localHost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365,
                httpOnly: true, // very important
            });

            res.status(201).json({
                id: user.id,
            });
        } catch (error) {
            next(error);
            return;
        }
    }

    async login(req: LoginUserRequest, res: Response, next: NextFunction) {
        // Validation
        const result = validationResult(req);

        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { email, password } = req.body;

        this.logger.debug("New Request to login a user", {
            email,
            password: "********",
        });

        // Check if username (email) is exist in database
        // Compare a password
        // Generate tokens
        // Add tokens to cookies
        // Return the response

        try {
            const user = await this.userService.findByEmail(email);

            if (!user) {
                const error = createHttpError(401, "Invalid email or password");
                next(error);
                return;
            }

            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            );

            if (!passwordMatch) {
                const error = createHttpError(401, "Invalid Email or Password");
                next(error);
                return;
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);

            // Persist the refreshToken
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            res.cookie("accessToken", accessToken, {
                domain: "localHost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true, // Very Important
            });

            res.cookie("refreshToken", refreshToken, {
                domain: "localHost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365,
                httpOnly: true,
            });

            this.logger.info("User has been logged in", { id: user.id });

            res.json({
                id: user.id,
            });
        } catch (error) {
            next(error);
            return;
        }
    }

    async self(req: AuthRequest, res: Response) {
        const user = await this.userService.findById(Number(req.auth.sub));

        res.json({ ...user, password: undefined });
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const payload: JwtPayload = {
                sub: req.auth.sub,
                role: req.auth.role,
            };

            // Generating access token
            const accessToken = this.tokenService.generateAccessToken(payload);

            // Persisting refresh token in the db

            const user = await this.userService.findById(Number(req.auth.sub));

            if (!user) {
                const error = createHttpError(
                    400,
                    "User with the token could not be found",
                );

                next(error);
                return;
            }

            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            // Delete old refresh token
            await this.tokenService.deleteRefreshToken(Number(req.auth.id));

            // Generating refresh token
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            res.cookie("accessToken", accessToken, {
                domain: "localHost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true,
            });

            res.cookie("refreshToken", refreshToken, {
                domain: "localHost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
                httpOnly: true,
            });

            this.logger.info("User has been logged in", { id: user.id });

            res.json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }
}
