# 3D One
3D One allows everyone to 3D scan objects and to manage and view their 3D models in one place.

This project was created using the following technologies:
 * Depth Camera and 3D Modeling:
    * Intel RealSense SDK
    * Open 3D
    * Open CV
 * Backend:
    * Server: Flask
    * DB: SQL Alchemy
 * Frontend
    * React.js

## Application Requirements

In order to run 3D One, you need the following:
* Intel RealSense L515 Camera plugged into a USB 3 input in a PC
* Python 3.6.8 installed

## Getting Started

First we need to install all the Python and Node.js packages used in this project:

```
cd [project dir]
npm install
pip install -r requirements.txt
```

After that, you need to go to ```node_modules\react-scripts\config\webpackDevServer.config.js``` file and add the following code under ```watchOptions```:

    watchOptions: {
      ignored: [ ignoredFiles(paths.appSrc), paths.appPublic ]
    },


Now you ready to run 3D One:
```
yarn start-api
npm start
```
