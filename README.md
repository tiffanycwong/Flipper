Flipper
=======

## General

### Supported Browsers
- Google Chrome
- Mozilla Firefox
- Microsoft Edge (minor bugs)
- Apple Safari
- Opera

### Incompatible Browsers
- Internet Explorer

### Public Access
- http://flipper.aakay.net

### Local Setup
1. Ensure `mongodb` is running: `sudo mongod`
2. Install the node modules: `sudo npm install --save --unsafe-perm`
3. Reset the database: `npm run init`
4. Start the server: `sudo npm start`
5. See section on troubleshooting if you run into any errors.

### Linting (ESLint)
- `npm run lint`
- (These aren't supposed to pass entirely.)

### Testing (Mocha)
- `npm test`

### Running
1. Ensure `mongodb` is running: `sudo mongod`
2. Start the server: `sudo npm start`

### Resetting
1. `npm run init`

### Troubleshooting
- If you get the `EADDRINUSE` error stating that the port the server is trying to listen on is in use, then change the `port` number in the `config` section of `package.json`.
- If you get the `EACCESS` error, then make sure you are using `sudo` or are authenticated as root via `sudo su -`.

## Discussion about how to use the app

### Using as a teacher
1. register and login account1
2. create a class, minilesson and page (include a resource)
3. add MCQs to the page 
4. publish the minilesson
4. logout

### Using as a student
1. register and login account2
2. join a class
3. logout
4. login with teacher account1
5. accept pending student from account2
6. logout
7. login with teacher account2
8. submit an answer to the mcq
9. create classes/pages/minilessons in this account (user can be both a teacher and student)

### Sample Account (flipper.aakay.net ONLY)
- username: `Anaconda` and password: `Anaconda1!`
