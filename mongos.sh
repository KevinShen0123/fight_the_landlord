apt install mongodb
mkdir -p /data/db
chmod 777  /data/db
mongod  --fork --syslog