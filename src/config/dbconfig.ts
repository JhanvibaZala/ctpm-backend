import mysql, { Pool } from "mysql2/promise"
import { config } from "./envConfig"

const db: Pool = mysql.createPool({
    host: config.DB_HOST || "localhost",
    user: config.DB_USER || "root",
    password: config.DB_PASSWORD || "password",
    database: config.DB_NAME || "db",
    port: 3306
})

export async function testconnection() {
    try {
        const connection = await db.getConnection();
        console.log("Database connected successfully");
        connection.release();
    } catch (err) {
        console.log("Database not connected", err);
    }
}


export default db