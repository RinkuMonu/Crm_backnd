const express = require("express");
const routerAeronpay = express.Router();
const aeronpayController = require("../controllers/aeronpay.controller");


routerAeronpay.post("/transfer", aeronpayController.transfer);
routerAeronpay.post("/callBack", aeronpayController.callBack);

module.exports = routerAeronpay;