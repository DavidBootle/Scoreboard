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

## Master User
The server uses a login system to allow certain people to access the tools used to manage the scoreboard, and block others from doing the same thing. This system doesn't allow for sign ups, because that would defeat the purpose of only certain people being able to have a login. Therefore, the server operates on the assumtion that there is at least one administrator who can login and use the server tools to create more accounts for people that need them.

The issue is that when you first create the server, there aren't any users. The solution to this problem is the master user. The master user is always available as a valid user so you can use the master username and password to login to the scoreboard even with no other accounts being set up. The master user will not up as a user in the users list unless you are signed in as the master user. In addition, the master user can perform actions such as deleting other user accounts, which is not possible with a normal administrator account. It is intended to be used for maintence or to setup the first account. It should not be used to login to the server on a regular basis.

The master user is **required** for the server to operate. The server will not start without the master user being set up.

To set up the master user, you need to create a .env file for your app. You can do that by running the following command in the repository root:

```bash
$ echo "" > .env
```

Then, add the following lines to the .env file, replacing `username` and `password` with the actual username and password for the master account:

```
MASTER_USER=username
MASTER_PASSWORD=password
```

**Please ensure that the master password is secure!** This account has complete access to all the functions of the scoreboard, including deleting other accounts, so if an adversary cracks your master password, your server is in serious trouble. It's recommended that you use a random password generate to create the password. The recommended requirements for the master password are:

- At least 20 characters
- Contains uppercase letters
- Contains lowercase letters
- Contains numbers
- Contains symbols

Remember that you will likely only use this account temporarily until you create your own standard admin account.

## Database URL
By default, the app uses the following value as its database url:

```
mongodb://localhost:27017/scoreboard
```

This url points to a mongodb service running on the current machine, and the default database "scoreboard". If you followed the steps in the Prerequisites section, then this default will work without needing to override it. However, if you are interested in using a cloud database service, it is necessary to overwrite the default database url. You can do this by adding the variable `DATABASE_URL` to your .env file. For example, if my database is located at google.com (as an example), you would add the following to your .env file:

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

# Usage
Please note that **none of the features listed here are final**. The scoreboard is still in development, and some features, such as login, have not yet been implemented.

## Scoreboard (`/`)
The scoreboard or main page (`/`) displays all the teams, their identifier, and their scores.

## Teams (`/teams`)
The teams page (`/tools`) contains a list of all the teams, their identifiers, and their scores, as well as tools used to manage the teams.

### New Team (`/teams/newteam`)
This page contains a form that allows you to add a new team to the scoreboard. You can access this page by clicking the plus (`+`) button in the top right corner of the team list on the teams page.

In order to successfully add a team, the information inputted must pass the following checks:
- None of the input forms are empty
- The starting score input is an integer
- The team identifier entered is unique

In addition, all of the inputs have regular expression validation. The regex expressions are as follows:
- Name: `^[A-Za-z0-9 \-_]+$`
- ID: `^[0-9]*$`
- Score: `^\-?[0-9]+$`

If any of these checks fail, the offending input will be highlighted red. You may also recieve alerts if the process of adding the team to the database encounters an issue on the server-side. These messages are `Database error` and `Failed to insert team into database`. If you see either of these messages, please create an issue on this repository, as they can only be caused by a bug in the server.
