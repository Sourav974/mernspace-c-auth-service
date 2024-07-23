import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { truncateTables } from "../utils";

describe("POST /auth/register", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // Database truncate
        await truncateTables(connection);
    });

    describe("Given all fields", () => {
        it("should return the 201 status code", async () => {
            // AAA

            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "secret",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(201);
        });

        it("should return valid json response", async () => {
            /// AAA

            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "secret",
            };

            // Act

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert

            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should persist the user in the database", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "secret",
            };

            // Act

            await request(app).post("/auth/register").send(userData);

            // Assert

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });

        it("should return an id of the created user", async () => {
            // AAA

            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "secret",
            };

            // Act

            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("id");

            const { id } = response.body;

            const userRepository = connection.getRepository(User);
            const user = await userRepository.findOne({ where: { id } });

            expect(user).toBeDefined();
            expect(user).toMatchObject({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
            });
        });
    });

    describe("Fields are missing", () => {});
});
