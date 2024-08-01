import request from "supertest";

import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { isJwt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";

describe("POST /auth/login", () => {
    let connection: DataSource;

    const registrationUserData = {
        firstName: "Sourav",
        lastName: "Yadav",
        email: " sourav@mern.space ",
        password: "passwordSecret",
    };
    const userData = {
        email: "sourav@mern.space",
        password: "passwordSecret",
    };

    const endpoint = "/auth/login";

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
        // await truncateTables(connection);

        await request(app).post("/auth/register").send(registrationUserData);
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it('should return the 200 status code"', async () => {
            const response = await request(app).post(endpoint).send(userData);

            expect(response.statusCode).toBe(200);
        });

        it("should return valid json response", async () => {
            const response = await request(app).post(endpoint).send(userData);

            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
        });

        it("should return the user id", async () => {
            const response = await request(app).post(endpoint).send(userData);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(response.body.id).toBeDefined();
        });

        it("should return 401 if email does not exist", async () => {
            const payload = { ...userData, email: "souravvv123@mern.space" };
            const response = await request(app).post(endpoint).send(payload);

            expect(response.statusCode).toBe(401);
        });

        it("should return 401 if password is incorrect", async () => {
            const payload = { ...userData, password: "notSecret" };

            const response = await request(app).post(endpoint).send(payload);
            expect(response.statusCode).toBe(401);
        });

        it("should return access and refresh token in a cookie", async () => {
            /*
            accessToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzIyMzgwMDk4LCJleHAiOjE3MjIzODM2OTgsImlzcyI6ImF1dGgtc2VydmljZSJ9.ge8AggIZ26bJN4GsKxks5CTpSHU6nX7byMVEWDLRKcoCTXiHhkO64sTpTPswRVXTdESTLiqKGr_AfEi5Ma-E5_yHm8ljzUxHj0_rcLVbztHEWns8enqREnGoK_QzwluN0EUuzHs_4y6PY6krrJAjRoUncTO6WmL9zakBHigaThGpXHejRPuRldE3nMRWHeLTcFOtVtUADWdSiZ2cy2FrjnilAKNryBqvguWkByI3ZIwf-PhfTF4ID2ZkJwSi2e2XMIiTskaO_E90ohMoOugkmplVFbHvfSX6SnghmyoU1qlR6PP6e_SaQEj9fXS9qQgA3zeAs87t9sK39ycKx7M8nw; 
            Path=/; Domain=localhost; HttpOnly; 
            Expires=Tue, 30 Jul 2024 23:54:58 GMT;
             */

            const response = await request(app).post(endpoint).send(userData);
            const cookies = (response.headers["set-cookie"] || []) as string[];

            // Assert
            let accessToken: string = "";
            let refreshToken: string = "";

            cookies.forEach((cookie) => {
                if (cookie.includes("accessToken")) {
                    accessToken = cookie.split(";")[0].split("=")[1];
                } else if (cookie.includes("refreshToken")) {
                    refreshToken = cookie.split(";")[0].split("=")[1];
                }
            });

            expect(accessToken.length).toBeGreaterThan(0);
            expect(refreshToken.length).toBeGreaterThan(0);
            expect(isJwt(accessToken)).toBe(true);
            expect(isJwt(refreshToken)).toBe(true);
        });

        it("should store the refresh token in the database", async () => {
            const response = await request(app).post(endpoint).send(userData);

            // Assert

            const refreshTokenRepo = connection.getRepository(RefreshToken);
            // const refreshTokens = await refreshTokenRepo.find()

            const tokens = await refreshTokenRepo
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany();

            expect(tokens).toHaveLength(2);
        });
    });

    describe("Fields are missing", () => {
        it("should return 400 status code if email is missing", async () => {
            const userDataWithoutEmail = { ...userData } as { email?: string };
            delete userDataWithoutEmail.email;

            const response = await request(app)
                .post(endpoint)
                .send(userDataWithoutEmail);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 if password is missing", async () => {
            const userDataWithoutPassword = { ...userData } as {
                password?: string;
            };
            delete userDataWithoutPassword.password;

            const response = await request(app)
                .post(endpoint)
                .send(userDataWithoutPassword);

            expect(response.statusCode).toBe(400);
        });
    });

    describe("Fields are not in proper format", () => {
        it("should trim the email before trying to login", async () => {
            const response = await request(app).post(endpoint).send(userData);

            const userRepo = connection.getRepository(User);
            const user = await userRepo.findOne({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                where: { id: response.body.id },
            });

            expect(user?.email).toBe(userData.email.trim());
        });
    });
});
