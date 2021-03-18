# PreCDC-Scoreboard-Node
A new, updated, more secure version of the PreCDC-Scoreboard project.

Made for PSA's CyberDefense team in 2021 by David Bootle.

This project is meant to replace the [old PreCDC-Scoreboard project](https://github.com/PSASchool/PreCDC-Scoreboard). It will be compatible with the current branch version of [the slot machine project](https://github.com/PSASchool/Python-Slots), which is the point of this scoreboard. 

This scoreboard runs on Express (Node.js). Documentation for this project will be updated as the project develops.

# Prerequisites
The following commands are for a new Ubuntu Server 20 machine.

1. Install git:

```bash
$ sudo apt-get install git
```

2. Install Node.js:

```bash
$ sudo apt-get install nodejs
$ sudo apt-get install npm
```

3. Install MongoDB
This server uses MongoDB as it's database. Therefore, MongoDB must be installed and running on the server.

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

# Start
Start the web server by running the following command:

```bash
$ sudo npm start
```
