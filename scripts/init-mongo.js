db.createUser({
    user: process.env.MONGODB_ROOT_USER,
    pwd: process.env.MONGODB_ROOT_PASSWORD,
    roles: [
        {
            role: 'readWrite',
            db: process.env.MONGO_INITDB_DATABASE,
        },
    ],
})
db.createCollection()
