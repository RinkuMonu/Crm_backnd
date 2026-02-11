const express = require("express");
const routerAeronpay = express.Router();
const aeronpayController = require("../controllers/aeronpay.controller");


routerAeronpay.post("/transfer", aeronpayController.transfer);
routerAeronpay.post("/callBack", aeronpayController.callBack);
routerAeronpay.post("/status", aeronpayController.status);

module.exports = routerAeronpay;