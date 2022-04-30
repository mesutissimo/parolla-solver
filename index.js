let questions;

const puppeteer = require("puppeteer");
const selectors = {
  start: "button.van-dialog__cancel",
  answerField: ".answer-field",
  countdown: ".countdown__timer",
};

const LETTER_TYPE_INTERVAL = 150;

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.on("response", (response) => {
    if (response.url().includes("api.radkod.com")) {
      response.json().then(({ success, data }) => {
        if (success) questions = data.questions;
      });
    }
  });
  await page.goto("https://www.parolla.app/");
  await page.waitForNetworkIdle();
  await page.waitForTimeout(3000);

  const enterFirst = await page.$(selectors.start);

  await enterFirst.click();

  const timer = await page.$(selectors.countdown);

  const checkTime = async () => {
    const timerStarted = await page.evaluate(
      (timer) => timer.innerText === "04:59",
      timer
    );
    if (!timerStarted) await checkTime();
  };
  await checkTime();

  const buttons = {};
  const buttonList = await page.$$(".hg-button");

  for await (const button of buttonList) {
    const letterText = await page.evaluate(
      (btn) => btn.getAttribute("data-skbtn"),
      button
    );
    Object.assign(buttons, { [letterText]: button });
  }

  for await (const q of questions) {
    const answere = q.answer.split(",")[0];
    for await (const letter of answere.split("")) {
      const button =
        letter === " "
          ? buttons["{space}"]
          : buttons[letter.toLocaleLowerCase()];
      button.click();
      await page.waitForTimeout(LETTER_TYPE_INTERVAL);
    }
    await page.keyboard.press("Enter");
  }
})();
