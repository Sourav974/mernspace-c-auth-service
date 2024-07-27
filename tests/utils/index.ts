import { DataSource } from "typeorm";

export const truncateTables = async (connection: DataSource) => {
    const entities = connection.entityMetadatas; // array that contains metadata information about each entity (such as the table name, columns, relations, etc.).

    for (const entity of entities) {
        const repository = connection.getRepository(entity.name); // repository is a helper class provides methods to perform database operations
        await repository.clear();
    }
};

export const isJwt = (token: string | null): boolean => {
    if (token === null) {
        return false;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
        return false;
    }

    try {
        parts.forEach((part) => {
            Buffer.from(part, "base64").toString("utf-8");
        });

        return true;
    } catch (error) {
        return false;
    }
};
