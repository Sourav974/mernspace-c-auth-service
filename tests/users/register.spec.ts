import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
// import { truncateTables } from "../utils";

describe("POST /auth/register", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
        // await truncateTables(connection);
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

        it("should assign a customer role", async () => {
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
            expect(users[0]).toHaveProperty("role");
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it("should store the hashed password in the database", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav ",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "secret",
            };

            // Act
            await request(app).post("/auth/register").send(userData);

            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
        });

        it("should return 400 status code if email already exists", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav ",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "secret",
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });

            //Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            const users = await userRepository.find();

            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });
    });

    describe("Fields are missing", () => {});
});
