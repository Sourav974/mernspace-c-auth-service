import { DataSource } from "typeorm";

export const truncateTables = async (connection: DataSource) => {
    const entities = connection.entityMetadatas; // array that contains metadata information about each entity (such as the table name, columns, relations, etc.).

    for (const entity of entities) {
        const repository = connection.getRepository(entity.name); // repository is a helper class provides methods to perform database operations
        await repository.clear();
    }
};
