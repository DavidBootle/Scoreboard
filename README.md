# PreCDC-Scoreboard-Node
A new, updated, more secure version of the PreCDC-Scoreboard project.

Made for PSA's CyberDefense team in 2021 by David Bootle.

This project is meant to replace the [old PreCDC-Scoreboard project](https://github.com/PSASchool/PreCDC-Scoreboard). It will be compatible with the current branch version of [the slot machine project](https://github.com/PSASchool/Python-Slots), which is the point of this scoreboard. 

This scoreboard runs on Express (Node.js). Documentation for this project will be updated as the project develops.

# Prerequisites
The server requires the following services/packages:
- git
- node.js
- mongodb

Please complete all of the following sections to install the required services/packages. Keep in mind that these instructions are for an Ubuntu Server 20 build.

## Install git

```bash
$ sudo apt-get install git
```

## Install node.js

```bash
$ sudo apt-get install nodejs
$ sudo apt-get install npm
```

## Install MongoDB
This server uses MongoDB as it's database. Therefore, it is recommended to install MongoDB as a service on the server. However, if you plan on using a cloud database (which should not be used for production), you can skip this section. Make sure to read the section "Database URL" in Setup.

Run the following commands to install MongoDB:
```bash
$ wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
$ echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
$ sudo apt-get update
$ sudo apt-get install -y mongodb-org
```

Then start the MongoDB service using:
```bash
sudo systemctl start mongod
```

You can verify that the database is running using:
```bash
sudo systemctl status mongod
```

# Setup
## Cloning the Repository
Run the following commands:

```bash
$ git clone https://github.com/PSASchool/PreCDC-Scoreboard-Node
$ cd PreCDC-Scoreboard-Node
```

## Install Packages
Running the following command will automatically install all packages required for the project.
```bash
$ npm install
```

## Generate Keys
Because the server operates on HTTPS in order to use a secure connection, the site must have a certificate. To create a self-signed certificate, use the following commands:

```bash
$ openssl req -x509 -newkey rsa:2048 -keyout keytmp.pem -out cert.pem -days 365
$ openssl rsa -in keytmp.pem -out key.pem
$ rm keytmp.pem
```

## Database URL
By default, the app uses the following value as its database url:

```
mongodb://localhost:27017/scoreboard
```

This url points to a mongodb service running on the current machine, and the default database "scoreboard". If you followed the steps in the Prerequisites section, then this default will work without needing to override it. However, if you are interested in using a cloud database service, it is necessary to overwrite the default database url. You can do this by providing the app with a .env file that contains the variable `DATABASE_URL`. For example, if my database is located at google.com (as an example), you would add the following .env file to the root folder of the repository:

```
DATABASE_URL=mongodb://www.google.com
```

The application reads this value on startup and retains it while the app is running. Changing the file while the app is running will have no effect. If you do override the database url, you may encounter a fatal error when starting the app. If you see "Connected to database!" when the app is started, then your database url is correct and the app is connected.

Please note that using a non-local database is **not recommended** for production. This feature is intended to be used when testing, in cases where you do not want to install MongoDB on your computer.

# Start
Start the web server by running the following command:

```bash
$ sudo npm start
```
