import request from "supertest";
import createJWKSMock from "mock-jwks";

import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";

import { Roles } from "../../src/constants";
import { User } from "../../src/entity/User";

describe("GET /auth/self", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    const userData = {
        firstName: "Sourav",
        lastName: "Yadav",
        email: " sourav@mern.space ",
        password: "passwordSecret",
    };

    const endpoint = "/auth/self";

    beforeAll(async () => {
        jwks = createJWKSMock("http://localHost:5501");
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwks.start();
        // Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
        // await truncateTables(connection);

        // await request(app).post("/auth/register").send(registrationUserData);
    });

    afterEach(() => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return the 200 status code", async () => {
            const accessToken = jwks.token({
                sub: "1",
                role: Roles.CUSTOMER,
            });

            const response = await request(app)
                .get(endpoint)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();
            expect(response.statusCode).toBe(200);
        });

        it("should return the user data", async () => {
            // Register user
            const userRepo = connection.getRepository(User);
            const data = await userRepo.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            // Generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });
            // add token to cookie

            const response = await request(app)
                .get(endpoint)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();

            // Assert

            // check if user id matches with registered user
            expect((response.body as Record<string, string>).id).toBe(data.id);
        });

        it("should not return the password field", async () => {
            // Register User
            const userRepo = connection.getRepository(User);
            const data = await userRepo.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            // generate Token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            const response = await request(app)
                .get(endpoint)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();

            expect(response.body as Record<string, string>).not.toHaveProperty(
                "password",
            );
        });

        it("should return 401 status code if token does not exists", async () => {
            const userRepo = connection.getRepository(User);
            await userRepo.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const response = await request(app).get(endpoint).send();

            expect(response.statusCode).toBe(401);
        });
    });

    describe("Fields are missing", () => {});

    describe("Fields are not in proper format", () => {});
});
