@echo off
echo Creating necessary directories...
mkdir C:\data\horizonstores1 2>nul
mkdir C:\data\horizonstores2 2>nul
mkdir C:\data\horizonstores3 2>nul
mkdir C:\data\log 2>nul

echo Starting MongoDB instances...
start "MongoDB Instance 1" mongod --config mongodb_conf/mongod1.cfg
start "MongoDB Instance 2" mongod --config mongodb_conf/mongod2.cfg
start "MongoDB Instance 3" mongod --config mongodb_conf/mongod3.cfg

echo Waiting for MongoDB instances to start...
timeout /t 5

echo Initializing replica set...
mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}, {_id: 1, host: 'localhost:27018'}, {_id: 2, host: 'localhost:27019'}]})"

echo MongoDB replica set should now be running.
echo To verify, run: mongosh --eval "rs.status()"
echo.
echo To stop MongoDB instances, simply close their console windows.