const express = require("express");
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const courseRoute=require("../routes/courseRouters")
const subscriptionRoute = require("../routes/subscriptionRoutes")
const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/courses",courseRoute);
app.use("/subscription",subscriptionRoute)



module.exports = app;
