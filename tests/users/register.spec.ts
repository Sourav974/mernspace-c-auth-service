import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import { isJwt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";
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

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return the 201 status code", async () => {
            // AAA

            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "passwordSecret",
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

            //  Arrange
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

            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
        });

        it("should persist the user in the database", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "passwordSecret",
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
                password: "passwordSecret",
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
                password: "passwordSecret",
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
                password: "passwordSecret",
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
                password: "passwordSecret",
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

        it("should return the access token and refresh token inside a cookie", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav ",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "passwordSecret",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            let accessToken: string = "";
            let refreshToken: string = "";
            const cookies = (response.headers["set-cookie"] || []) as string[];

            cookies.forEach((cookie) => {
                if (cookie.includes("accessToken")) {
                    accessToken = cookie.split(";")[0].split("=")[1];
                } else if (cookie.includes("refreshToken")) {
                    refreshToken = cookie.split(";")[0].split("=")[1];
                }
            });

            expect(accessToken.length).toBeGreaterThan(0);
            expect(refreshToken.length).toBeGreaterThan(0);
            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });

        it("should store the refreshToken in the Database", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav ",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "passwordSecret",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            const refreshTokenRepo = connection.getRepository(RefreshToken);
            // const refreshTokens = await refreshTokenRepo.find();
            // expect(refreshTokens).toHaveLength(1);

            const tokens = await refreshTokenRepo
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany();

            expect(tokens).toHaveLength(1);
        });
    });

    describe("Fields are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav ",
                lastName: "Yadav",
                email: "",
                password: "passwordSecret",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository("User");
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if firstName is missing", async () => {
            // Arrange
            const userData = {
                firstName: "",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "secret",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if lastName is missing", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "",
                email: "sourav@mern.space",
                password: "secret",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository("User");
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if password is missing", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "sourav@mern.space",
                password: "",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository("User");
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
    });

    describe("Fields are not in proper format", () => {
        it("should the email field", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav ",
                lastName: "Yadav",
                email: " sourav@mern.space ",
                password: "passwordSecret",
            };

            // Act
            await request(app).post("/auth/register").send(userData);

            // Assert

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            const user = users[0];

            expect(user.email).toBe("sourav@mern.space");
        });

        it("should return 400 status code if email is not a valid email", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "souravmern.space",
                password: "secret",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("should return 400 status code if password length is less than 8 characters", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "souravmern.space",
                password: "passwordSecret",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert

            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("should return an array of error messages if email is missing", async () => {
            // Arrange
            const userData = {
                firstName: "Sourav",
                lastName: "Yadav",
                email: "",
                password: "passwordSecret",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            expect(response.body).toHaveProperty("errors");
            expect(
                (response.body as Record<string, string>).errors.length,
            ).toBeGreaterThan(0);

            // const userRepository = connection.getRepository(User)
            // const user = await userRepository.find()
        });
    });
});
