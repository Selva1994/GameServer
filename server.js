const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

let users = [];
let messages = [];
let score = {};
const gridN = 10;
const numMines = gridN;
let grid = Array(gridN)
  .fill("")
  .map(() => Array(gridN).fill(""));

const suffleMine = () => {
  let newgrid = Array(gridN)
    .fill("")
    .map(() => Array(gridN).fill(""));
  let minesRamaining = numMines;
  while (minesRamaining > 0) {
    const row = Math.floor(Math.random() * gridN);
    const col = Math.floor(Math.random() * gridN);
    if (newgrid[row][col] === "") {
      newgrid[row][col] = "1";
      minesRamaining--;
    }
  }
  grid = [...newgrid];
  io.emit("grid", grid);
};

io.on("connection", (socket) => {
  socket.on("getUsers", () => {
    console.log("Users requested:", users);
    io.emit("users", users);
  });
  socket.on("getMessages", () => {
    console.log("Messages requested:", messages);
    io.emit("message", messages);
  });
  socket.on("message", (message) => {
    messages.push(message);
    console.log("Message received:", message);
    io.emit("message", messages);
  });
  socket.on("getGrid", () => {
    console.log("Grid requested:");
    console.log("score", score);
    io.emit("grid", grid);
  });
  socket.on("getScore", () => {
    console.log("Score requested:", score);
    io.emit("score", score);
  });
  socket.on("score", (score1) => {
    score = { ...score, ...score1 };
    users = users.map((user1) => {
      return { ...user1, score: score1[user1.name] };
    });
    console.log("Score received:", score);
    io.emit("score", score);
    io.emit("users", users);
  });

  socket.on("newUser", (user) => {
    console.log("New user connected:", user);
    if (users.find((u) => u.id === user.id)) {
      console.log("User already exists:", user);
      io.emit("users", users);
    } else {
      users.push(user);
      console.log("New user connected:", user);
      io.emit("users", users);
    }
    if (users.length === 1) {
      suffleMine();
    }
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
  socket.on("logout", (user) => {
    console.log("User logged out:", user);
    const index = users.findIndex((u) => u.name === user.name);
    console.log(index, users);
    if (index !== -1) {
      users = users.filter((u) => u.name !== user.name);
      messages = messages.filter(
        (message) => !String(message).includes(user.name)
      );
      io.emit("users", users);
      io.emit("message", messages);
      delete score[user.name];
      io.emit("score", score);
      console.log("User logged out:", user.name, users, score, messages);
    }
  });
  socket.on("reset", (user) => {
    console.log("Reset requested by user:", user);
    messages = [];
    // io.emit("users", users);
    score = {};
    io.emit("score", score);
    io.emit("message", messages);
  });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
