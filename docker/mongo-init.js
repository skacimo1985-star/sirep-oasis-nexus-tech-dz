db.createUser({
  user: process.env.MONGO_ROOT_USER || 'admin',
  pwd: process.env.MONGO_ROOT_PASSWORD || 'changeme',
  roles: [
    { role: 'readWrite', db: process.env.MONGO_DB_NAME || 'sirep_db' }
  ]
});
