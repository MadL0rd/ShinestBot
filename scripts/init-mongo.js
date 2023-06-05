db.createUser({
    user: process.env.MONGODB_ROOT_USER,
    pwd: process.env.MONGODB_ROOT_PASSWORD,
    roles: [
        {
            role: 'readWrite',
            db: process.env.MONGODB_DATABASE,
        },
    ],
})
db.createCollection()
