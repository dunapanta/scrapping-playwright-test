import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import captcha from "@antiadmin/anticaptchaofficial";
import { chromium } from "playwright-core";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Test" });
});

app.post("/scrapping", async (req, res) => {
  const resolveCaptcha = async () => {
    try {
      
      captcha.settings.recaptchaDataSValue = "set me for google.com domains";
      const responseCaptcha = await captcha.solveRecaptchaV2Proxyless(
        "https://aplicaciones.adres.gov.co/bdua_internet/Pages/ConsultarAfiliadoWeb.aspx",
        "6LcchMAUAAAAALbph_uFlNWt0exLPvlXcwUhZ6hG"
      );
      return responseCaptcha;
    } catch (error) {
      console.log("ERROR CAPTCHA", error);
      throw new Error(error);
    }
  };
  const browser = await chromium.launch({
    headless: true,
  });
  try {
    const { documentNumber } = req.body;
    /* const validationErrors = validateInputs({
      documentNumber,
    }); */
    /* if (validationErrors) {
      return validationErrors;
    } */
    
    const page = await browser.newPage();
    await page.goto(
      "https://aplicaciones.adres.gov.co/bdua_internet/Pages/ConsultarAfiliadoWeb.aspx"
    );
    await page.fill("#txtNumDoc", documentNumber);
    let resultCaptcha = await resolveCaptcha();
    console.log("RES", resultCaptcha);
    //resolve captcaha
    await page.evaluate((result) => {
      document.getElementById("g-recaptcha-response").innerHTML = result;
    }, resultCaptcha);
    await page.click("#btnConsultar");
    let resultData = {};
    await page.waitForTimeout(30000);
    console.log("Page has finished loading");
    const errorNotFoundMessage = await page.$("#lblError");
    console.log("errorNotFoundMessage", errorNotFoundMessage);
    if (errorNotFoundMessage) {
      await browser.close();
      return formatJSONResponse({
        data: {
          success: false,
          message: "No se encontraron resultados",
        },
      });
    }
    await browser.close();
  } catch (err) {
    await browser.close();
    return res.status(500).json({ message: err.message });
  }
});

app.post("/scrapping-2", async (req, res) => {
  try {
    const browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto("https://github.com/dunapanta");
    // Extract username
    const username = await page.$eval(
      ".p-nickname.vcard-username.d-block",
      (el) => el.innerText
    );
    console.log("username", username);

    await browser.close();
    return res.status(200).json({ message: username });
  } catch (err) {
    await browser.close();
    return res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
});
