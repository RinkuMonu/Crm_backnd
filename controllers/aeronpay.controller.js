const axios = require("axios");
const headersData = {
    "client-id": process.env.Client_ID,
    "client-secret": process.env.Client_Secret,
    "Content-Type": "application/json"
}

class aeronpay {

    // transfer
    transfer = async (req, res) => {
        try {
            const data = req.body
            console.log("aeronpay payload", data);

            const response = await axios.post("https://superprodapi.aeronpay.in/api/core-services/serviceapi-prod/finance/securepay/v2/payout/imps_payment", data,
                {
                    headers: headersData
                }
            )
            return res.status(200).json({
                status: true,
                msg: "Transfer data forwarded successfully",
                data: response.data,
            });
        } catch (error) {
            console.log("aeronpay Transfer data forwarded error", error);
            return res.status(500).json({
                status: false,
                msg: "Failed to process AeronPay Transfer data",
                error: error?.response?.data || error.message,
            });

        }
    }

    // callback
    callBack = async (req, res) => {
        try {
            console.log("aeronpay callBack data", req.body);
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    status: false,
                    msg: "Empty callback data received",
                });
            }
            const data = req.body
            const response = await axios.post("https://server.finuniques.in/api/v1/aeronpay/callBack", data,
                {
                    timeout: 10000,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
            return res.status(200).json({
                status: true,
                msg: "Callback forwarded successfully",
                data: response.data,
            });
        } catch (error) {
            console.log("aeronpay callBack error", error?.response?.data || error.message);
            return res.status(500).json({
                status: false,
                msg: "Failed to process AeronPay callback",
                error: error?.response?.data || error.message,
            });

        }
    }

    status = async (req, res) => {
        try {
            console.log("aeronpay status data", req.body);

            const { client_referenceId, mobile } = req.body;

            if (!client_referenceId) {
                return res.status(400).json({
                    success: false,
                    message: "client_referenceId is required"
                });
            }
            if (!mobile) {
                return res.status(400).json({
                    success: false,
                    message: "mobile is required"
                });
            }
            const aeronpayRes = await axios.post(
                "https://api.aeronpay.in/api/serviceapi-prod/api/reports/transactionStatus",
                {
                    client_referenceId,
                    mobile
                },
                {
                    headers: headersData
                }
            );
            return res.status(200).json({
                status: true,
                msg: "Status data forwarded successfully",
                data: aeronpayRes.data,
            });
        } catch (error) {
            console.log("aeronpay status error", error?.response?.data || error.message);
            return res.status(500).json({
                status: false,
                msg: "Failed to process AeronPay status",
                error: error?.response?.data || error.message,
            });

        }
    }
}

module.exports = new aeronpay()