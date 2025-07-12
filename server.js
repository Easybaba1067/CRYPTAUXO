require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const axios = require("axios");
const crypto = require("crypto");
const punycode = require("punycode/");
const MongoStore = require("connect-mongo");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    secret: "your-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// database connection
mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// payment Schema
const transactionSchema = new mongoose.Schema({
  merchantTradeNo: String,
  orderAmount: Number,
  currency: String,
  status: String,
  responseData: Object,
  timestamp: {
    type: String, // 👈 store as a string if you're formatting it manually
    default: () => new Date().toISOString().slice(0, 16).replace("T", " "),
  },

  // timestamp: { type: Date, default: () => new Date() },
});

// informationSchema
const infoSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  Number: Number,
  companyName: String,
  WebsiteUrl: String,
  postalCode: Number,
  DOB: {
    type: Date,
    required: true,
  },
  city: String,
  country: String,
  address: String,
});
// user Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  fullName: String,
  ID: Number,
  amount: Number,
  information: infoSchema,
  transactions: [transactionSchema],
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Binance Signature Generator
function generateSignature(payload, secretKey, timestamp, nonce) {
  const message =
    timestamp + "\n" + nonce + "\n" + JSON.stringify(payload) + "\n";
  return crypto.createHmac("sha512", secretKey).update(message).digest("hex");
}

// home route
app.route("/").get((req, res) => {
  res.sendFile(__dirname + "/index.html");
});
// register page route
app
  .route("/register")
  .get((req, res) => {
    res.render("register", { checking: "" });
  })
  .post(async (req, res, next) => {
    try {
      const user = await User.register(
        { username: req.body.email },
        req.body.password
      );

      await req.login(user); // Only works if req.login supports promises

      return res.redirect("/information");
    } catch (err) {
      if (err.name === "UserExistsError") {
        return res.render("register", { checking: "email taken" });
      }
      return next(err);
    }
  });

// login page route
app
  .route("/login")
  .get((req, res) => {
    const messages = req.session.messages || [];
    const errorMessage = messages[0] || "";

    // Clear messages after displaying
    req.session.messages = [];

    res.render("login", { checking: errorMessage });
  })
  .post(
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureMessage: "incorrect details",
    }),
    function (req, res) {
      res.redirect("/dashboard");
    }
  );

//  dashboard
app.route("/dashboard").get(async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  try {
    const user = await User.findById(req.user._id);
    const info = user.information;
    const transact = user.transactions;

    if (!info) return res.render("information");

    const symbols = [
      "BTCUSDT",
      "ETHUSDT",
      "BNBUSDT",
      "SOLUSDT",
      "XRPUSDT",
      "ADAUSDT",
      "DOGEUSDT",
      "AVAXUSDT",
      "LINKUSDT",
    ];
    const encoded = encodeURIComponent(JSON.stringify(symbols));
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encoded}`;

    const response = await fetch(url);
    let marketData = await response.json();

    if (!Array.isArray(marketData)) {
      marketData = Object.values(marketData);
    }

    res.render("dashboard", {
      firstname: info.firstname,
      lastname: info.lastname,
      amount: user.amount,
      ID: user.ID,
      email: user.username,
      markets: marketData,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.render("dashboard", {
      firstname: info?.firstname || "",
      lastname: info?.lastname || "",
      amount: user?.amount || 0,
      ID: user?.ID || "",
      email: user?.username || "",
      markets: [],
    });
  }
});
// account histoty route
app
  .route("/account-history")
  // ✅ GET: Fetch user transactions and render view
  .get(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/login");
    }

    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).send("User not found");

      const info = user.information;
      const transactions = user.transactions;

      if (!info) return res.render("information");

      if (!transactions || transactions.length === 0) {
        return res.render("no-transaction", {
          firstname: info.firstname,
          lastname: info.lastname,
          amount: user.amount,
          ID: user.ID,
          email: user.username,
          transactions,
        });
      }

      res.render("account-history", {
        firstname: info.firstname,
        lastname: info.lastname,
        amount: user.amount,
        ID: user.ID,
        email: user.username,
        transaction: transactions,
      });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).send("Internal server error");
    }
  })

  // ✅ POST: Trigger Binance payment & update user wallet
  .post(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user._id;
    const orderAmount = req.body.amount;

    if (!orderAmount || parseFloat(orderAmount) < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid deposit amount" });
    }

    const payload = {
      merchantTradeNo: `deposit_${Date.now()}`,
      orderAmount: orderAmount,
      currency: "USDT",
      goods: {
        goodsType: "01",
        goodsCategory: "D000",
        referenceGoodsId: "deposit",
        goodsName: "Wallet Deposit",
        goodsDetail: "Deposit into account wallet",
      },
    };

    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString("hex");
    const signature = generateSignature(
      payload,
      process.env.API_SECRET,
      timestamp,
      nonce
    );

    const headers = {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": timestamp,
      "BinancePay-Nonce": nonce,
      "BinancePay-Certificate-SN": process.env.API_KEY,
      "BinancePay-Signature": signature,
    };

    try {
      const response = await axios.post(
        "https://bpay.binanceapi.com/binancepay/openapi/v2/order",
        payload,
        { headers }
      );

      const tx = {
        merchantTradeNo: payload.merchantTradeNo,
        orderAmount: payload.orderAmount,
        currency: payload.currency,
        status: response.data.status,
        responseData: response.data,
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      };

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $push: { transactions: tx },
          $inc: { amount: parseFloat(orderAmount) },
        },
        { new: true }
      );

      res.json({
        success: true,
        user: updatedUser,
        message: "Payment initiated",
      });
    } catch (err) {
      console.error("Payment error:", err.response?.data || err.message);
      res.status(500).json({ success: false, message: "Payment failed" });
    }
  });
// webhook//binance
app.post("/webhook/binance", async (req, res) => {
  const { merchantTradeNo, status } = req.body;

  if (status === "SUCCESS") {
    try {
      const user = await User.findOne({
        "transactions.merchantTradeNo": merchantTradeNo,
      });
      if (!user) throw new Error("User not found");

      const matchedTransaction = user.transactions.find(
        (tx) => tx.merchantTradeNo === merchantTradeNo
      );
      if (!matchedTransaction) throw new Error("Transaction not found");

      const orderAmount = matchedTransaction.orderAmount;

      const updatedUser = await User.findOneAndUpdate(
        { "transactions.merchantTradeNo": merchantTradeNo },
        {
          $set: { "transactions.$.status": "SUCCESS" },
          $inc: { amount: parseInt(orderAmount.replace(/[$,]/g, "")) },
        },
        { new: true }
      );

      console.log(`Wallet updated for transaction: ${merchantTradeNo}`);
      res.status(200).send("Webhook processed and wallet updated");
    } catch (err) {
      console.error("Webhook error:", err.message);
      res.status(500).send("Webhook processing failed");
    }
  } else {
    console.log(`Webhook received with status: ${status}`);
    res.status(200).send("No wallet update needed");
  }
});

app.route("/no-transaction").get(async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  try {
    const user = await User.findById(req.user._id);
    const info = user.information;

    if (!info) {
      return res.render("information");
    }

    res.render("no-transaction", {
      firstname: info.firstname,
      lastname: info.lastname,
      amount: user.amount,
      ID: user.ID,
      email: user.username,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal server error");
  }
});
// exchange route
app.route("/exchange").get(async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  try {
    const user = await User.findById(req.user._id);
    const info = user.information;

    if (!info) {
      return res.render("information");
    }

    res.render("exchange", {
      firstname: info.firstname,
      lastname: info.lastname,
      amount: user.amount,
      ID: user.ID,
      email: user.username,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal server error");
  }
});
//  profile
app
  .route("/profile")
  .get(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/login");
    }

    try {
      const user = await User.findById(req.user._id);
      const info = user.information;

      if (!info) {
        return res.render("information");
      }

      const DOB = info.DOB.toISOString().substring(0, 10);
      res.render("profile", {
        firstname: info.firstname,
        lastname: info.lastname,
        address: info.address,
        number: info.Number,
        DOB: DOB,
        email: user.username,
      });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).send("Internal server error");
    }
  })

  .post(async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/register");

    const {
      firstname,
      lastname,
      mobileNumber,
      companyName,
      url,
      postalCode,
      DOB,
      cityName,
      country,
      address,
      amount,
    } = req.body;

    try {
      await User.findByIdAndUpdate(req.user._id, {
        information: {
          firstname,
          lastname,
          Number: mobileNumber,
          companyName,
          WebsiteUrl: url,
          postalCode,
          city: cityName,
          DOB,
          country,
          address,
        },
      });
      res.redirect("/profile");
    } catch (err) {
      console.error("Error saving information:", err);
      res.status(500).send("Something went wrong.");
    }
  });
// information
app
  .route("/information")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render("information");
    } else {
      res.redirect("/register");
    }
  })

  .post(async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect("/register");

    const generateRandomNumber = (min = 10000, max = 100000) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const randomNumber = generateRandomNumber();

    const {
      firstname,
      lastname,
      mobileNumber,
      companyName,
      url,
      postalCode,
      DOB,
      cityName,
      country,
      address,
      amount,
    } = req.body;

    try {
      await User.findByIdAndUpdate(req.user._id, {
        information: {
          firstname,
          lastname,
          Number: mobileNumber,
          companyName,
          WebsiteUrl: url,
          postalCode,
          city: cityName,
          DOB,
          country,
          address,
        },
        amount: parseInt(amount.replace(/[$,]/g, "")),
        ID: randomNumber,
      });

      res.redirect("/dashboard");
    } catch (err) {
      console.error("Error saving information:", err);
      res.status(500).send("Something went wrong.");
    }
  });

// logout handle
app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
// app listen
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
