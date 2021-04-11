# Scoreboard
Originally created for my school's PreCDC game in 2021, this secure scoreboard is fully functional and licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International. If you would like to use the scoreboard for commercial use, please contact me.

© 2021 David Bootle

# About

This scoreboard is a fully functional, customizable, secure web server that runs on node.js. Documentation for this scoreboard is written for Ubuntu Server, but this should run on any server that can run node.js. Detailed technical documentation can be found in the wiki of this project.

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

## Custom Title and Score Labels
Using the `.env` file can customize the title shown on the main scoreboard page, and the label of the `score` column on the scoreboard. To do this, add the `SCOREBOARD_TITLE` and `SCORE_LABEL` variables, respecitvely to the `.env` file.

# Start
Start the web server by running the following command:

```bash
$ sudo npm start
```

# Usage
Please note that **none of the features listed here are final**. The scoreboard is still in development, and some features, such as login, have not yet been implemented.

## Scoreboard (`/`) (GET)
The scoreboard or main page (`/`) displays all the teams, their identifier, and their scores.

## Teams (`/teams`) (GET) (AUTH REQUIRED)
The teams page (`/tools`) contains a list of all the teams, their identifiers, and their scores, as well as tools used to manage the teams. This page is protected, which means that you must be logged in to access it. Attempting to access this page without being logged in will redirect you to the login page.

### New Team (`/teams/newteam`) (GET|POST) (AUTH REQUIRED)
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

This page is protected, which means you must be logged in to access it. Attempting to access this page without being logged in will redirect you to the login page.

### Remove Team (`/teams/removeteam`) (POST) (AUTH REQUIRED)
This post path removes a team from the scoreboard. It takes a JSON object that must include the `id` parameter. `id` is the id of the team to delete. This page must be accompanied by a valid auth token, or a 401 error will be returned. You can delete a team by clicking the red trash icon next to a team on the `teams` page. Clicking this button will open a confirmation window to confirm that the team should be deleted.

Opening `/teams` with the query parameter `confirm` set to `false` will disable the confirmation messages. Example: `/teams?confirm=false`. Opening the page with the `confirm` query parameter set to anything else will enable confirmation messages.

### Edit Team (`/teams/editteam`) (GET|POST) (AUTH REQUIRED)
GET: This page is a form that allows you to change the name and/or id of a team. The name and id form inputs are validated the same way that they are when creating a new team. When loading this page, the url query parameter `id` is required. If not given, the server will return status code 400 (Bad Context) with a message explaining the need for the parameter. In addition, the `id` parameter must correlate to an actual team id. If a team with that id is not found, then the server will return 404 (Not Found) with a message stating the team doesn't exist. If `id` is given and is a valid team id, then the server will send the actual page.

POST: This path tells the server to attempt to update a team entry. The following parameteres are required: `id`, `name`, and `oldId`. `oldId` is the id of the team you want to change, `id` is the new team id, and `name` is the new team name. If the `id` parameter matches an already existing team entry that is not the team entry you are trying to change, then the server will respond with status code 409 (Conflict) along with a JSON data packet containing error information. 

### Change Score (`teams/changescore`) (GET|POST) (AUTH REQUIRED)
//TODO add documentation for this

## Login (`/login`) (GET|POST)
This page allows you to login to the site. You can also be redirected to this site by other pages that are protected.

The page can take one query argument, `to`, that defines where the user should be sent after login is completed. The value of this argument should be URI encoded. If the parameter is not defined, the default is `/`.

This page will also automatically redirect to the `to` query parameter if it is loaded and the user is logged in. This means that if you have a number of windows that have been logged out, you can log into one of them, then simply refresh the rest.

## Logoff (`/logoff`) (GET)
Navigating to this page will log the user out and redirect them to the home page. There is currently no specification for where the user should be sent once logged out, since the only unprotected page is the homepage.

In addition, navigating to this page while logged in will immediatly send the `login` event to all pages logged in as that user, reloading them and causing them to log out as well. Therefore, logging out of one page will log the user out of every page at once. This is a security measure meant to make sure that stray connections do not stay logged in.

## Users (`/users`) (GET) (AUTH REQUIRED)
This page is built for managing users. On the left side of the screen is a list of all the users accounts. If the user is logged in as the master user, then they will also see the master user listed. Otherwise, the master user does not show up on this list. On the right side of the screen is information about the user, as well as tool buttons that can be used to manage the user account. If the user is signed in as the master, they will also see tools for managing other user accounts.

### New User (`/users/newuser`) (GET|POST) (AUTH REQUIRED)
This page contains a form that allows you to add a new user. You must be an authenticated user to access this page via GET or POST. You can access this page by clicking the "Add New User" button under the user list in the Users page.

### Delete User (`/users/deleteuser`) (POST) (AUTH REQUIRED)
This path instructs the server to delete a user account. The following parameters are required: `username`. In addition, this path requires authorization. Attempting to access the path without authorization will result in the server returning with a status of 401 (Unauthorized).

When this path is called, the server checks to make sure that the `username` parameter is the same as the authorized user's username. This way, any user can delete their own account, but they cannot delete other user's accounts. The `Delete My Account` button on the Users page is by default supplied with the username of the currently authorized user. However, it is still possible to attempt to contact the server and delete another account using console commands.

The server may respond with status code 403 (Forbidden) under the following circumstances: the user to be deleted does not match the authenticated user, or the user to be deleted was the master user. In both cases, the server will also respond with a JSON object in the following format:

```javascript
{
  ok: false,
  reason: 'Error message',
  errorCode: 'ERROR_CODE'
}
```

The server may also return a response with `ok: false` if the server failed to delete the user or an error occurs during execution. In both cases, `reason` and `errorCode` will also be provided to state the problem.

If the user was successfully deleted, the server will respond with `{ ok: true }` and no other parameters. The server will then send the `user-update` command to all `user-update` listeners. The server will also send the `logoff` event to all clients connected as that user, causing a full logoff of the users account.

When `/users` recieves a success message from the server, it redirects the user to the login page.

### Change Password (`/users/changepassword`) (GET|POST) (AUTH REQUIRED)
GET: This page allows a user to change their password. The page has three inputs: a hidden input containing the username of the authenticated user and two password inputs, one for the password, and the other to confirm the password. This page cannot be accessed by unauthorized users. You can access this page by clicking the `Reset Password` button on the Users page.

POST: This path instructs the server to change a user password. It takes the following parameters: `username` and `password`.

The server will respond with a 401 (Unauthorized) status code if you attempt to access this path without proper authorization.

The server will respond with a 403 (Forbidden) status code if the `username` parameter does not match the username of the authenticated user, or the `username` parameter is the master user.

If the action is successful, the server will respond with `{ok: true}`.

### Log Out User (`/users/master/logoutuser`) (GET) (MASTER AUTH REQUIRED)
This page can only be accessed by the master user. Attempting to access the path without a valid authentication will result in a redirect to the login page on GET, and a 401 (Unauthorized) error on POST. Attempting to access the path with a valid authentication but as any user other than the master user will result in a 403 (Forbidden) error.

The page can be used to invalidate any user's login token (making them sign in again), and to conduct a full log off (where all sessions automatically redirect to the login page).

### Change User Password (`/users/master/changepassword`) (GET) (MASTER AUTH REQUIRED)
This page can only be accessed by the master user. Attempting to access the path without a valid authentication will result in a redirect to the login page. Attempting to access the path with a valid authentication but as any user other than the master user will result in a 403 (Forbidden) error.

This page can be used by the master user to change the password of any user account.

### Delete User Account (`/users/master/deleteuser`) (GET) (MASTER AUTH REQUIRED)
This page can only be accessed by the master user. Attempting to access the path without a valid authentication will result in a redirect to the login page. Attempting to access the path with a valid authentication but as any user other than the master user will result in a 403 (Forbidden) error.

This page can be used by the master user to delete any user account.

# Secret (`/secret`) (GET)
It's a secret. :)

# API

## Team Score (`/api/get/teamscore`) (POST)
Post path to get information about a team's score. Does not require authorization.

Takes parameters:
- `id`: the id of the team to get the score for

Possible responses:
- 400: `Valid request must include id parameter.`
- 404: `No team with that id.`
- 200: Team score
- 500: `Database error`

## Auth Token (`/api/get/authtoken`) (POST)
Post path to get an auth token using a team password. Note that using this will invalidate other auth tokens for the team.

Takes parameters:
- `password`: the team password of the team to get an auth token for

Possible responses:
- 400: `One or more required parameters are missing.`
- 401: `Invalid.`
- 500: `Failed to update.`
- 200: Auth token
- 500: `Database error`

## Set Team Score (`/api/set/teamscore`) (POST)
Post path to set a team's score. Requires authorization in the form of an auth token set as the `Authorization` header.

Takes parameters:
- `score`: the new score of the team

Possible responses:
- 400: `One or more required parameters are missing.`
- 400: `One or more parameters failed validation.`
- 500: `Failed to update`
- 200: `ok`
- 500: `Database error`

## Set Team Name (`/api/set/teamname`) (POST)
Post path to set a team's name. Requires authorization in the form of an auth token set as the `Authorization` header.

Takes parameters:
- `name`: the new team of the team

Possible responses:
- 400: `One or more required parameters are missing.`
- 400: `One or more parameters failed validation.`
- 500: `Failed to update`
- 200: `ok`
- 500: `Database error`

## Get Team Name (`/api/get/name`) (POST)
A post path that return the name of the authenticated team. Requires authorization in the form of an auth token set as the `Authorization` header.

Returns the name of the team.

## Get Team ID (`/api/get/id`) (POST)
A post path that returns the id of the authenticated team. Requires authorization in the form of an auth token set as the `Authorization` header.

Returns the id of the team.

## Get Team Score (`/api/get/score`) (POST)
A post path that gets the current score of the authenticated team. Reqiures authorization in the form of an auth token set as the `Authorization` header.

Returns the current score of the team.

## Get Team List (`/api/get/teams`) (POST)
Post path that returns a json object with every team and it's `id`, `name`, and `score`. Does not require authorization.

Teams format:
```json
[
  {
    "name": "Team 1",
    "id": "000",
    "score": "0"
  },
  {
    "name": "Team 2",
    "id": "001",
    "score": "0"
  }
]
```

## Test (`/api/test`) (POST)
A post path that tests authorization. Reqiures authorization in the form of an auth token set as the `Authorization` header.

Possible responses:
- 401: `Invalid authorization header.`
- 200: `OK`

# Design
This section covers the design of the app, including different design decisions, and how the app functions.

## User Authentication
This section covers how the server deals with logged in users. From this point forward, logged in users will be refered to as authenticated users.

When a user is authenticated, they have access to management tools for both the scoreboard and for other user accounts. Users that are not authenticated cannot see pages they can't access in menus. If they attempt to navigate to a protected page, they will be redirected to the login page.

The server marks a user as authenticated by setting a cookie with an authentication token. This authentication token is generated every time a user logs in, and is stored to the user's cookies. The cookie lasts until the end of the session. The authentication token is then linked to the user in the database for the duration that the user is logged in. When accessing any page, the app will read the authentication token from the user's request and attempt to look up the user in the database. The user's information is then added to the request for destination processing. If an authentication token cannot be found, or if no user matches the given authentication token, the user is set to `null` in the request.

When the user attempts to access a protected page, the app checks to see if the user object inserted into the request is `null`. If it is, it redirects the user to the login page, setting the `to` query parameter to the url they were originally trying to access, so that when they finish logging in, it redirects them to the page they were originally trying to visit. If the user is not `null`, then the app allows the user access to the page.

## Scoreboard Updates
Certain pages in the app contain scoreboards that need to update when scoreboard information changes. Therefore, the server sends a `scoreboard-update` event to all connected clients when the scoreboard changes in a major way. This simply causes said clients to refresh in the background, updating the scoreboard information. `scoreboard-update` will not be used with information like score changes, as it's fairly simple for the client to update itself. (since it doesn't involve heavy changes to the DOM). In addition, the number of score changes would make refreshes more common than is recommended.

## Sockets
This application uses socket.io for communication between clients and the server. Bascially, the server can send events to web pages, and web pages can send events to the server. Clients can react to these events, for example, updating the user interface, or reloading the page.

Current uses of sockets include:

- Refreshing all pages that the user is logged into when the user is logged out, causing them to go to the login screen.
- Refreshing all pages that contain a scoreboard when the scoreboard is updated in a major way.
