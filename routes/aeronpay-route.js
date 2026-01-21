const express = require("express");
const routerAeronpay = express.Router();
const aeronpayController = require("../controllers/aeronpay.controller");


routerAeronpay.post("/callBack", aeronpayController.callBack);

module.exports = routerAeronpay;