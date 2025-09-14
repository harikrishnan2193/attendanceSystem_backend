const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || null,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL Database Connected Successfully');
        await sequelize.sync();
    } catch (err) {
        console.error('Database Connection Failed:', err.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
