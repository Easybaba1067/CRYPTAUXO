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

// transaction
const transactionSchema = new mongoose.Schema({
  orderId: String,
  amount: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "failed"],
    default: "pending",
  },
  txId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  confirmedAt: Date,
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

      // Use callback pattern for req.login()
      req.login(user, (err) => {
        if (err) return next(err);
        return res.redirect("/information");
      });
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

    if (!info) return res.render("information");

    // ✅ Define CoinGecko-friendly coin IDs
    const coinIds = [
      "bitcoin",
      "ethereum",
      "binancecoin",
      "solana",
      "ripple",
      "cardano",
      "dogecoin",
      "avalanche-2",
      "chainlink",
    ];

    // 📊 CoinGecko Simple Price API
    const url = "https://api.coingecko.com/api/v3/simple/price";
    const response = await axios.get(url, {
      params: {
        ids: coinIds.join(","),
        vs_currencies: "usd",
        include_24hr_change: "true",
        include_last_updated_at: "true",
      },
      timeout: 20000,
    });

    // 🔍 Format data for dashboard
    const marketData = Object.entries(response.data).map(([id, info]) => ({
      name: id.replace(/-/g, " ").toUpperCase(),
      price: info.usd,
      change: info.usd_24h_change?.toFixed(2) ?? null,
      last_updated: info.last_updated_at
        ? new Date(info.last_updated_at * 1000).toLocaleString()
        : "N/A",
    }));

    res.render("dashboard", {
      firstname: info.firstname,
      lastname: info.lastname,
      amount: user.amount,
      ID: user.ID,
      email: user.username,
      markets: marketData,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err.message);
    if (res.headersSent) return;
    res.status(500).send("Server error: " + err.message);
  }
});
// verify payment route
app.get("/verify-payment", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const userId = req.user._id;
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac("sha256", process.env.API_SECRET)
      .update(query)
      .digest("hex");
    const url = `https://api.binance.com/sapi/v1/capital/deposit/hisrec?${query}&signature=${signature}`;

    const binanceRes = await axios.get(url, {
      headers: { "X-MBX-APIKEY": process.env.API_KEY },
    });

    const deposits = binanceRes.data;
    const confirmed = deposits.find(
      (dep) => dep.status === 1 && dep.asset === "BTC"
    );
    if (!confirmed) {
      return res.json({
        success: false,
        message: "No confirmed BTC deposit found.",
      });
    }

    const btcAmount = parseFloat(confirmed.amount);
    const rateRes = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    const btcRateUSD = rateRes.data.bitcoin.usd;
    const depositUSD = btcAmount * btcRateUSD;

    const user = await User.findById(userId);
    const existingTx = user.transactions.find(
      (tx) => tx.orderId === confirmed.txId
    );

    if (existingTx) {
      existingTx.status = "confirmed";
      existingTx.txId = confirmed.txId;
      existingTx.confirmedAt = new Date();
      user.amount += Math.floor(depositUSD);
    } else {
      user.transactions.push({
        orderId: confirmed.txId,
        amount: btcAmount,
        usdAmount: depositUSD,
        status: "confirmed",
        confirmedAt: new Date(),
      });
      user.amount += Math.floor(depositUSD);
    }

    await user.save();

    res.json({
      success: true,
      tx: confirmed.txId,
      btc: btcAmount.toFixed(8),
      usd: depositUSD.toFixed(2),
      message: "Deposit confirmed and saved.",
    });
  } catch (err) {
    console.error("Error verifying payment:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error verifying payment." });
  }
});

// account histoty route
app.get("/account-history", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send("User not found");

    const info = user.information;
    const transactions = user.transactions || [];

    if (transactions.length === 0) {
      return res.redirect("/no-transaction");
    }

    res.render("account-history", {
      firstname: info.firstname,
      lastname: info.lastname,
      amount: user.amount,
      ID: user.ID,
      email: user.username,
      transactions,
    });
  } catch (err) {
    console.error("Error loading account-history:", err);
    res
      .status(500)
      .render("error", { error: "Failed to load account history." });
  }
});

// no-transaction for account history
app.get("/no-transaction", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send("User not found");

    const info = user.information;

    res.render("no-transaction", {
      message: "No transactions found.",
      firstname: info.firstname,
      lastname: info.lastname,
      amount: user.amount,
      ID: user.ID,
      email: user.username,
    });
  } catch (err) {
    console.error("Error rendering no-transaction:", err);
    res
      .status(500)
      .render("error", { error: "Failed to render no-transaction view." });
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
        amount: parseFloat(amount.replace(/[$,]/g, "")),
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
