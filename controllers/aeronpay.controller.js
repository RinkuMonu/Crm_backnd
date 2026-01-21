const axios = require("axios");

class aeronpay {
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
}

module.exports = new aeronpay()