module.exports = async (ctx) => {
  ctx = ctx || {};
  const ORIGIN = "http://localhost:3000";
  const LOGIN_URL = `${ORIGIN}/login`;
  const HOME_URL = `${ORIGIN}`;

  const ID_SEL = "#loginId";
  const PW_SEL = "#loginPassword";
  const BTN_SEL = "#loginButton";

  let { page, browser } = ctx;
  let spawned = false;

  // LHCI가 page를 안 줄 수도 있으니 직접 띄우기
  if (!page) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const puppeteer = require("puppeteer");
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    page = await browser.newPage();
    spawned = true;
  }

  try {
    // 1) 로그인 페이지 이동
    await page.goto(LOGIN_URL, { waitUntil: "networkidle0", timeout: 60000 });

    // 2) 폼 대기
    await page.waitForSelector(ID_SEL, { timeout: 30000 });

    // 3) 자격 증명 (환경변수 우선)
    const loginId = process.env.LHCI_LOGIN_ID || "testuser";
    const loginPw = process.env.LHCI_LOGIN_PW || "1234pass";

    // 입력
    await page.click(ID_SEL, { clickCount: 3 }).catch(() => {});
    await page.keyboard.press("Backspace").catch(() => {});
    await page.type(ID_SEL, String(loginId), { delay: 10 });

    await page.click(PW_SEL, { clickCount: 3 }).catch(() => {});
    await page.keyboard.press("Backspace").catch(() => {});
    await page.type(PW_SEL, String(loginPw), { delay: 10 });

    // 4) 제출 + 네비게이션(없어도 무시)
    await Promise.all([
      page.click(BTN_SEL),
      page
        .waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 })
        .catch(() => {}),
    ]);

    // 5) localStorage에 세션 비슷한 값 들어왔는지 느슨히 확인(실패해도 계속)
    await page
      .waitForFunction(
        () => {
          try {
            const raw = localStorage.getItem("local-storage");
            if (!raw) return false;
            const s = JSON.parse(raw)?.state;
            return !!(s?.refreshToken && s?.userNo);
          } catch {
            return false;
          }
        },
        { timeout: 15000 }
      )
      .catch(() => {});

    // 6) 홈으로 진입 시도(실패해도 계속)
    await page
      .goto(HOME_URL, { waitUntil: "networkidle0", timeout: 60000 })
      .catch(() => {});
  } finally {
    // 우리가 띄운 브라우저라면 닫기
    if (spawned && browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
};
